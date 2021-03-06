
// var K_selectedProfileColor = null;
var K_selectedCand = null;
var K_selectCallback = null;
var K_addProfile = true;
var K_curProfile = 1;
var K_curContext = 0; //test context.
$(document).ready(function () {
    $('.K_commitButton').mouseenter(function () {
        $(this).addClass('K_hovering');
    })
    $('.K_cand').mouseenter(function () {
        if ($(this).hasClass('K_available')) {
            $(this).addClass('K_hovering');
            var IV = $('.K_inputValue');
            IV.html(K_getParsedCand($(this)));
            $('.K_inputField').addClass('K_alert');
            setTimeout(function () {
                $('.K_inputField').removeClass('K_alert');
            }, 200);
        }
    })
    $('.K_commitButton').mouseleave(function () {
        $(this).removeClass('K_hovering');
        $(this).removeClass('K_selected');
    })
    $('.K_cand').mouseleave(function () {
        if ($(this).hasClass('K_available')) {
            $(this).removeClass('K_hovering');
            var IV = $('.K_inputValue');
            if (K_selectedCand === null) {
                IV.html('');
            }
            else {
                IV.html(K_getParsedCand(K_selectedCand));
            }
        }
    })
    $('.K_commitButton').mousedown(function () {
        $(this).addClass('K_selected');
        $(this).removeClass('K_hovering');
    })
    $('.K_cand').mousedown(function () {
        if (!$(this).hasClass('K_available')) {
            return;
        }
        K_clearCand();
        K_selectedCand = $(this);
        $(this).addClass('K_selected');
        $('.K_commitButton').addClass('K_active');
        $(this).removeClass('K_hovering');
    })
    $('.K_commitButton').mouseup(function () {
        $(this).removeClass('K_selected');
    })
    $('.K_commitButton').click(function () {
        if (K_selectedCand !== null) {
            $('.K_cand').text('');
            if (K_selectCallback !== null) {
                var tmpHolder = K_selectCallback;
                K_selectCallback = null;
                tmpHolder({ content: K_selectedCand.attr('content'), tag: K_selectedCand.attr('tag') });
                $(".K_MainLog").animate({ scrollTop: $('.K_MainLog').prop("scrollHeight") }, 500);
            }
            K_clearCand();
            K_selectedCand = null;
            $('.K_inputValue').html('');
        }
    })
    $('.K_word').mouseenter(function () {
        console.log(this);
        $(this).addClass('K_active');
    })
    $('.K_word').mouseleave(function () {
        $(this).removeClass('K_active');
    })
    $('html').click(function () {
        $('.K_wordPopup.K_selected').removeClass('K_selected');
    })
    //$('.K_Pcolor').get(Number(getAllUrlParams().active)).classList.add('K_selected');
    K_curProfile = Number(getAllUrlParams().active);
    K_curContext = Number(getAllUrlParams().sit);
    console.log(K_curContext);
    console.log(K_curProfile);
    if (isNaN(K_curProfile) || isNaN(K_curContext)){
        //do nothing.
    }
    else{
        K_GoConv(Context_Situations[K_curProfile][K_curContext]);
    }
    
})

function K_getParsedCand(obj) {
    return K_parseLine(obj.attr('curLine'), true);
}

function K_clearCand() {
    if (K_selectedCand !== null) {
        K_selectedCand.removeClass('K_selected');
    }
    $('.K_commitButton').removeClass('K_active');
}

var normal = '1', findTag = '2', makeCands = '3';
function K_GoConv(rawLines, lineStack = []) {
    var curTag = null;
    var curMode = normal;
    var curCandIdx = -1;
    for (var idx = 0; idx < rawLines.length; idx++) {
        var curLine = rawLines[idx];
        if (curMode === findTag) {
            if (K_checkTag(curLine, curTag)) {
                curMode = normal;
                continue;
            }
            else {
                continue;
            }
        }
        else if (curMode === makeCands) {
            var candIdx = 0;
            $('.K_cand').removeClass('K_available');
            while (K_isCand(curLine)) {
                var cand = $('.K_cand[idx=' + String(candIdx) + ']');
                cand.attr('tag', curLine.substring(2, curLine.indexOf(']')));
                cand.attr('content', '- ' + curLine.substring(curLine.indexOf(' ') + 1));
                cand.attr('curLine', curLine);
                cand.html('');
                cand.addClass('K_available');
                cand.append(K_parseLine(curLine, false));
                candIdx++;
                idx++;
                curLine = rawLines[idx];
            }
            K_selectCallback = function (info) {
                K_createMyDialog(K_parseLine(info.content));
                lineStack.push({ content: info.content, isMe: true });
                var Nidx;
                for (Nidx = idx; Nidx < rawLines.length; Nidx++) {
                    if (K_checkTag(rawLines[Nidx], info.tag)) {
                        break;
                    }
                }
                if (Nidx === rawLines.length) {
                    alert('nowhere to go');
                    return;
                }
                K_addProfile = true;
                K_GoConv(rawLines.slice(Nidx + 1, rawLines.length), lineStack);
            }
            return;
        }
        else if (curMode === normal) {
            if (K_isFin(curLine)) {
                K_wrapUpConv(lineStack);
                return;
            }
            if (K_isTag(curLine)) {
                alert('wrong' + curLine);
                K_wrapUpConv(lineStack);
                return;
            }
            if (K_isGoto(curLine)) {
                curMode = findTag;
                curTag = curLine.substring(3, curLine.length - 1);
                continue;
            }
            if (curLine === '?') {
                curMode = makeCands;
                continue;
            }
            else {
                var toAdd = null;
                var sentence = '';

                if (K_addProfile) {
                    toAdd = document.createElement('img');
                    toAdd.src = K_TEMP_getProfilePic();
                    toAdd.classList.add('K_profilePic');
                    $('.K_MainLog').append(toAdd);
                    K_addProfile = false;
                }

                toAdd = document.createElement('div');
                toAdd.classList.add('K_Log', 'K_VF');

                var wordElems = K_parseLine(curLine);

                for (var widx = 0; widx < wordElems.length; widx++) {
                    $(toAdd).append(wordElems[widx]);
                    sentence += $(wordElems[widx]).data('value') + ' ';
                }

                $(toAdd).append(
                    $('<img class="K_Speak" src="Speaker_Icon.png">')
                        .data('sentence', sentence)
                        .click(function(event) {
                            responsiveVoice.speak($(event.currentTarget).data('sentence'), 'Korean Male');
                        })
                );

                $('.K_MainLog').append(toAdd);
                lineStack.push({ content: curLine, isMe: false });
                continue;
            }
        }
    }
    K_wrapUpConv(lineStack);
}


function K_createMyDialog(wordElems) {
    var toAdd = document.createElement('div');
    var sentence = '';

    toAdd.classList.add('K_Log', 'K_ME');

    for (var widx = 0; widx < wordElems.length; widx++) {
        $(toAdd).append(wordElems[widx]);
        sentence += $(wordElems[widx]).data('value') + ' ';
    }

    $(toAdd).append(
        $('<img class="K_Speak" src="Speaker_Icon.png">')
            .data('sentence', sentence)
            .click(function(event) {
                responsiveVoice.speak($(event.currentTarget).data('sentence'), 'Korean Female');
            })
    );


    $('.K_MainLog').append(toAdd);
}

function K_TEMP_getProfilePic(){
    return "../VFData/profile" + K_curProfile + ".png";
}

function K_wrapUpConv(lineStack) {
    $('.K_cand').removeClass('K_available');
    $('<div>').addClass(['K_Log', 'K_SYS']).html('Situation is over.').appendTo($('.K_MainLog'));
    ConversationData.saveConvAsTest(lineStack, K_curProfile, K_curContext);
}
//returns array of HTMLelements. (for inside div)
//only called when normal mode.
function K_parseLine(rawLine, makeLink = true, IDsOut = null) {
    var ret = [];
    var wordList = rawLine.split(' ');
    if (wordList[0] === '-' || K_isCand(rawLine) || wordList[0] === '#') {
        //normal or cand.
        for (var idx = 1; idx < wordList.length; idx++) {
            var word;
            if (makeLink) {
                word = K_parseWord(wordList[idx], rawLine);
            }
            else {
                var splited = wordList[idx].split('>>');
                if (IDsOut && splited.length > 1) {
                    IDsOut.push(Number(splited[1]));
                }
                word = splited[0] + ' ';
            }
            ret.push(word);
        }
        return ret;
    }
    else {
        alert('wrong!!');
        return [];
    }
}
function K_parseWord(word, rawLine) {
    var result = word.split('>>');
    var ret;
    if (result.length === 1) {
        ret = document.createElement('span');
        ret.innerHTML = result[0] + ' ';
        $(ret).data('value', result[0]);
        return ret;
    }
    else {
        ret = document.createElement('span');
        ret.classList.add('K_word');
        ret.setAttribute('ID', result[1]);
        ret.innerHTML = result[0] + ' ';
        $(ret).append(K_makeWordPopup(result[1], rawLine));
        //$(ret).mouseenter(function () {
        //    $(this).find('.K_wordPopup').addClass('K_active');
        //})
        //$(ret).mouseleave(function () {
        //    $(this).find('.K_wordPopup').removeClass('K_active');
        //})
        $(ret).click(function () {
            setTimeout(function () { $(ret).find('.K_wordPopup').addClass('K_selected') }, 1);
        })
        $(ret).data('value', result[0]);
        return ret;
    }
}


function K_makeWordPopup(wordID, rawLine) {
    var whole = $(document.createElement('div'));
    whole.addClass('K_wordPopup');
    whole.append(K_getWordInfo(wordID));
    var addButton = $(document.createElement('button'));
    addButton.attr('ID', wordID);
    isVocabInList(K_getContextID(K_curProfile, K_curContext), Number(wordID), function (includes) {
        if (!includes) {
            addButton.addClass('K_addButton').html('Add to vocab!').click(function () {
                var lineInfo = K_parseLine(rawLine, false).join('');
                WordsUtil.addVocabToContext(K_getContextID(K_curProfile, K_curContext), Number(wordID), lineInfo);
                $('.K_addButton[ID=' + wordID + ']').attr('disabled', 'true').html('Added');
            });
        }
        else {
            addButton.addClass('K_addButton').html('Added');
            addButton.attr('disabled', 'true');
        }
        whole.append(addButton);
    })
    return whole;
}

function K_getContextID(prf, sit) {
    return (prf * 4) + sit;
}

function K_getWordInfo(wordID) {
    var ret = $(document.createElement('span'));
    vocabFromID(Number(wordID), function (vocab) {
        ret.html(vocab.korean + ':<br />' + vocab.shortmeaning);
    })
    return ret;
}

function K_isFin(str) {
    if (str === '__FIN__') {
        return true;
    } else {
        return false;
    }
}
function K_isGoto(str) {
    if (str.match(/^->\[.+]$/)) {
        return true;
    }
    else {
        return false;
    }
}
function K_isCand(str) {
    if (str.match(/^(\?\[.+] ).*/)) {
        return true;
    }
    else {
        return false;
    }
}
function K_isTag(str) {
    if (str.match(/^\[.+]$/)) {
        return true;
    }
    else {
        return false;
    }
}

function K_checkTag(str, tag) {
    if ('[' + tag + ']' === str) {
        return true;
    }
    else {
        return false;
    }
}
