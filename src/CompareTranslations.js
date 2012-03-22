/**
 * Compare pt and pt-br translations of the MW messages
 * @author: [[User:Helder.wiki]]
 * @tracking: [[Special:GlobalUsage/User:Helder.wiki/Tools/CompareTranslations.js]] ([[File:User:Helder.wiki/Tools/CompareTranslations.js]])
 */
/*jslint browser: true, white: true, plusplus: true, devel: true */
/*global jQuery, mediaWiki, jsMsg */
(function ($, mw /* , undefined */ ) {
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

function compareTranslations(lang1, lang2, group) {
	var	mwmsg = {},
		total = 0,
		diffCount = 0,
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
				jsMsg('Processing list of "' + group + '" messages in "' + lang1 + '"... (' + total + ' messages processed)');
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
						delete mwmsg[msg.key];
						diffCount++;
						jsMsg(
							'Processing list of "' + group +
							'" messages in "' + lang2 +
							'"... (so far, ' + diffCount +
							' messages differ from its "' +
							lang1 + '" version)'
						);
					}
				});
				/*jslint unparam: false*/
				if (newOffset) {
					getMsgList(lang, group, newOffset);
				} else {
					jsMsg(
						'There are ' + total + ' messages in group "' +
						group + '", ' + (total - diffCount) +
						' of which are identical in "' + lang1 + '" and "' +
						lang2 + '" (' + (100 * (total - diffCount) / total).toFixed(1) + ' %).'
					);
					console.debug('identical=', mwmsg);
					console.debug('diff=', diff);
				}
			}
		}).error(function () {
			jsMsg('There was an error while requesting the translation list. =(');
		});
	}
	jsMsg('Initializing comparison of "' + group + '" messages in "' + lang1 + '" and "' + lang2 + '"');
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

}(jQuery, mediaWiki));