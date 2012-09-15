/**
 * Compare pt and pt-br translations of the MW messages
 * @author: [[User:Helder.wiki]]
 * @tracking: [[Special:GlobalUsage/User:Helder.wiki/Tools/CompareTranslations.js]] ([[File:User:Helder.wiki/Tools/CompareTranslations.js]])
 */
/*jslint browser: true, white: true, plusplus: true, devel: true */
/*global mediaWiki, jQuery */
( function ( mw, $ ) {
'use strict';

// Script para incluir links pt/pt-br nos títulos das páginas de mensagens do sistema
if (mw.config.get('wgCanonicalNamespace') === 'MediaWiki') {
	$(function () {
		var	cab = document.getElementById('firstHeading'),
			pt = document.createElement('a'),
			ptbr = document.createElement('a'),
			pagept = mw.config.get('wgArticlePath')
					.replace('$1', mw.config.get('wgPageName'))
					.replace(/\/[a-z\-]{2,5}$/g, '/pt'),
			pageptbr;

		if (!pagept.match(/\/pt$/g)) {
			pagept += '/pt';
		}
		pageptbr = pagept + '-br';

		pt.innerHTML = ' →pt';
		ptbr.innerHTML = ' →pt-br';

		pt.setAttribute('href', pagept);
		ptbr.setAttribute('href', pageptbr);

		if (mw.config.get('wgPageName').match('/pt-br')) {
			cab.appendChild(pt);
		} else if (mw.config.get('wgPageName').match('/pt')) {
			cab.appendChild(ptbr);
		} else {
			cab.appendChild(pt);
			cab.appendChild(ptbr);
		}

	});
}

// Copy from http://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript
function levenshtein(str1, str2) {
	// small modification to avoid an error
	if( typeof str1 !== 'string' || typeof str2 !== 'string'){
mw.log(str1, str2);
	}
	// end of modification
/*jslint vars: true*/
	var l1 = str1.length, l2 = str2.length;
	if (Math.min(l1, l2) === 0) {
		return Math.max(l1, l2);
	}
	var i = 0, j = 0, d = [];
/*jslint vars: false*/
	for (i = 0 ; i <= l1 ; i++) {
		d[i] = [];
		d[i][0] = i;
	}
	for (j = 0 ; j <= l2 ; j++) {
		d[0][j] = j;
	}
	for (i = 1 ; i <= l1 ; i++) {
		for (j = 1 ; j <= l2 ; j++) {
		d[i][j] = Math.min(
		        d[i - 1][j] + 1,
		        d[i][j - 1] + 1,
		        d[i - 1][j - 1] + (str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1)
		);
		}
	}
	return d[l1][l2];
}
// End of copy

function compareTranslations(lang1, lang2, group) {
	var	mwmsg = {},
		total = 0,
		diffCount = 0,
		diffOneCount = 0,
		firstLang = true,
		diff = {};

	function getMsgList(lang, group, offset) {
		$.getJSON('//translatewiki.net/w/api.php', {
			format: 'json',
			action: 'query',
			list: 'messagecollection',
			mclimit: 500, // Maximum allowed for non-bots
			mcgroup: group,
			mcoffset: offset || 0,
			mcprop: 'translation',
			mclanguage: lang
		}, function (data) {
			var	list = (data && data.query && data.query.messagecollection) || [],
				cont = data && data['query-continue'],
				newOffset = (cont && cont.messagecollection && cont.messagecollection.mcoffset) || 0;
			if (firstLang) {
				total += list.length;
				mw.notify(
					'Processando a lista de mensagens "' + group + '" em "' +
						lang1 + '"... (' + total + ' mensagens processadas)', {
						tag: 'msg-analysis'
					}
				);
				/*jslint unparam: true*/
				$.each(list, function (i, msg) {
					mwmsg[msg.key] = msg.translation;
				});
				/*jslint unparam: false*/
				if (newOffset) {
					getMsgList(lang, group, newOffset);
				} else {
					firstLang = false;
					getMsgList(lang2, group);
				}
			} else {
				/*jslint unparam: true*/
				$.each(list, function (i, msg) {
					if (mwmsg[msg.key] !== msg.translation) {
						diff[msg.key] = {};
						diff[msg.key][lang1] = mwmsg[msg.key];
						diff[msg.key][lang2] = msg.translation;
						if ( diff[msg.key][lang1] && diff[msg.key][lang2] && levenshtein( diff[msg.key][lang1], diff[msg.key][lang2] ) === 1 ) {
							diffOneCount++;
						}
						delete mwmsg[msg.key];
						diffCount++;
						mw.notify(
							'Processando a lista de mensagens "' + group +
							'" em "' + lang2 +
							'"... (até agora, ' + diffCount +
							' diferem de sua versão "' +
							lang1 + '", e ' + diffOneCount + ' delas diferem apenas por um único caractere)', {
								tag: 'msg-analysis'
							}
						);
					}
				});
				/*jslint unparam: false*/
				if (newOffset) {
					getMsgList(lang, group, newOffset);
				} else {
					mw.notify(
						'Há ' + total + ' mensagens no grupo "' +
						group + '",  das quais ' + (total - diffCount) +
						' são idênticas em "' + lang1 + '" e "' +
						lang2 + '" (' + (100 * (total - diffCount) / total).toFixed(1) +
						' %), e ' + diffOneCount + ' diferem apenas por um caractere (' +
						(100 * diffOneCount / total).toFixed(1) + ' % do total)', {
						autoHide: false
					});
					mw.log('identical=', mwmsg);
					mw.log('diff=', diff);
				}
			}
		}).error(function () {
			mw.notify('Houve um erro ao requisitar a lista de traduções.');
		});
	}
	mw.notify('Iniciando a comparação das mensagens "' + group + '" em "' + lang1 + '" e "' + lang2 + '"', {
		tag: 'msg-analysis'
	});
	getMsgList(lang1, group || 'core');
}

function run(){
	$(mw.util.addPortletLink(
		'p-cactions',
		'#',
		'Compare pt & pt-br',
		'ca-compare',
		'Compare pt and pt-br translations of the MW messages in provided group'
	)).click(function (e) {
		var group;
		e.preventDefault();
		group = prompt(
			'What group of messages do you want to compare?\n\n Some examples' +
				' include core-0-mostused and ext-0-wikimedia-main.\nSee' +
				' http://translatewiki.net/w/api.php for a list of available groups',
			'core'
		);
		if (group !== null) {
			compareTranslations('pt', 'pt-br', group);
		}
	});
}

if ( mw.config.get('wgSiteName') === 'translatewiki.net' ){
	$(run);
}

}( mediaWiki, jQuery ) );