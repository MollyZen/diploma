var pane;
var firstPage;

let pages = new Map();

let thereWasDelete = false;

function setPane(newPane) {
    pane = newPane;
    /*    pane.addEventListener('input', (ev) => {
            const range = window.getSelection().getRangeAt(0);
            const preCaretRange = range.cloneRange();
            let parent = preCaretRange.startContainer;
            if (parent.nodeName === '#text')
                parent = parent.parentElement;
            if (parent.innerText.length === 0 && parent.innerText.match(/\n+/g)) {
                if (thereWasDelete) {
                    const tmp = parent.childNodes;
                    tmp[tmp.length -1].setAttribute('class', 'default-break');
                    thereWasDelete = false;
                }
                else
                    addDefaultBreak(parent);
            }

            getCaretIndex(pane);
            toggleTooltip(ev, pane);
        })*/
    //mouse
    pane.addEventListener('click', (e) => {
        //getCaretIndex(pane);
        console.log(getViewCaretIndex());
        //toggleTooltip(e, pane);
    })
    pane.addEventListener('keydown', function (ev){
        if (ev.key === 'Backspace'){
            ev.preventDefault();
            const [start, end] = getViewCaretStartEnd();
            deleteText(start - 1, end - start);
        }
        else if (ev.key === 'Enter'){
            ev.preventDefault();
            if (!ev.shiftKey) {
                handleTextInput('\n', null, getViewCaretIndex());
            }
            else{
                handleTextInput('\v', null, getViewCaretIndex());
            }
        }
    })
    pane.addEventListener('beforeinput', function (ev){
        ev.preventDefault();
        handleTextInput(ev.data, null, getViewCaretIndex());
    });
}

const pageWidth = '210mm';
const pageHeight = '297mm';

const topMargin = '25.4mm';
const bottomMargin = '25.4mm';
const leftMargin = '25.4mm';
const rightMargin = '25.4mm';

function initPages(){
    //firstPage = addPage(null, null);
    pane.setAttribute('style', pane.getAttribute('style') + '; width: ' + pageWidth);
    pane.setAttribute('style', pane.getAttribute('style') + '; height: ' + pageHeight);
    pane.setAttribute('style', pane.getAttribute('style') + '; background-color: white');
    pane.setAttribute('style', pane.getAttribute('style') + '; padding: ' + topMargin);
}
function Page(page, margins, text, prev, next){
    this.page = page;
    this.margins = margins;
    this.text = text;
    this.prev = prev;
    this.next = next;
    this.break = null;
}

function addPage(prevPage, nextPage){

    /*const newPage = document.createElement("div");
    newPage.setAttribute('style', 'background-color: white; margin:0; padding:0; overflow:hidden;');
    newPage.setAttribute('style', newPage.getAttribute('style')+'; width: ' + pageWidth);
    newPage.setAttribute('style', newPage.getAttribute('style')+'; height: ' + pageHeight);
    newPage.setAttribute('class', 'A4');
    newPage.setAttribute('contenteditable', 'true');

    const margins = document.createElement("div");
    margins.setAttribute('style', 'margin-left: ' + leftMargin);
    margins.setAttribute('style', margins.getAttribute('style')+'; margin-right: ' + rightMargin);
    margins.setAttribute('style', margins.getAttribute('style')+'; margin-top: ' + topMargin);
    margins.setAttribute('style', margins.getAttribute('style')+'; margin-bottom: ' + bottomMargin);
    margins.setAttribute('contenteditable', 'false');*/

    const text = document.createElement('div');
    text.setAttribute('class', 'text');
    text.setAttribute('contenteditable', 'true');
    text.setAttribute('style', 'outline: 0px solid transparent; overflow: hidden; word-wrap:break-word;');
    let calcStatement = 'calc(' + pageHeight + ' - ' + topMargin + ' - ' + bottomMargin + ');';
    text.setAttribute('style', text.getAttribute('style') + ';max-height:' + calcStatement);
    text.setAttribute('style', text.getAttribute('style') + ';height:' + calcStatement);
    calcStatement = 'calc(' + pageWidth + ' - ' + leftMargin + ' - ' + rightMargin + ');';
    text.setAttribute('style', text.getAttribute('style') + ';max-width:' + calcStatement);
    text.setAttribute('style', text.getAttribute('style') + ';width:' + calcStatement);

    text.setAttribute('style', text.getAttribute('style')+'; padding-left: ' + leftMargin);
    text.setAttribute('style', text.getAttribute('style')+'; padding-right: ' + rightMargin);
    text.setAttribute('style', text.getAttribute('style')+'; padding-top: ' + topMargin);
    text.setAttribute('style', text.getAttribute('style')+'; padding-bottom: ' + bottomMargin);
    text.setAttribute('style', text.getAttribute('style')+'; background-color: white');

    addDiv(text);

    /*margins.appendChild(text);
    newPage.appendChild(margins);*/

    const obj = new Page(text, null, text, prevPage, nextPage);

    pages.set(text, obj);

    //other events
    text.addEventListener('overflow', function (ev){
        const nextPage = addPage(obj, null);
        setCaret(nextPage, nextPage.text.childNodes[0].childNodes[0],1);
        ev.preventDefault();
        console.log(obj);
    })
    text.addEventListener('paste', (ev) => {
        console.log(ev.clipboardData.getData('text/plain'));
    })
    if (prevPage) {
        prevPage.page.after(text);
        prevPage.next = obj;
        addPageBreak(prevPage);
    }
    else {
        pane.appendChild(text);
    }

    return obj;
}

let w3 = true;
let ie = false;
function getCaretPosition(element) {
    var caretOffset = 0;
    if (w3) {
        var range = window.getSelection().getRangeAt(0);
        var preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
    } else if (ie) {
        var textRange = document.selection.createRange();
        var preCaretTextRange = document.body.createTextRange();
        preCaretTextRange.moveToElementText(element);
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        caretOffset = preCaretTextRange.text.length;
    }
    return caretOffset;
}

function setCaret(editable, subel, pos) {
    let range = document.createRange()
    let sel = window.getSelection()

    range.setStart(subel, pos)
    range.collapse(true)

    sel.removeAllRanges()
    sel.addRange(range)
}

function removePage(page) {
    page.page.remove();
    pages.delete(page);
    if (page.prev) {
        page.prev.next = page.next;
        if (!page.next)
            removePageBreak(page.prev)
    }
    if (page.next) {
        removePageBreak(page);
        page.next.prev = page.prev;
    }
}

function addPageBreak(page){
    const pageBreak = document.createElement("div");
    pageBreak.setAttribute('style', 'height: 30px;');
    pageBreak.setAttribute('contenteditable', 'false')
    page.page.after(pageBreak);
    page.break = pageBreak;

    return pageBreak;
}
function removePageBreak(page) {
    page.break.remove();
    page.break = null;
}

function addDefaultBreak(anchor){
    const br = document.createElement('br');
    br.setAttribute('class', 'default-break');
    anchor.appendChild(br);
    return br;
}

function addVerticalBreakPlaceholder(anchor){
    const br = document.createElement('br');
    br.setAttribute('class', 'vertical-placeholder');
    anchor.appendChild(br);
    return br;
}

function addDiv(anchorElement, isAfter){
    const defaultParagraph = document.createElement('div');
    const span = document.createElement('span');
    addDefaultBreak(span);
    defaultParagraph.appendChild(span);
    if (isAfter)
        anchorElement.after(defaultParagraph);
    else
        anchorElement.appendChild(defaultParagraph);
    return defaultParagraph;
}

///
/// Actual functionality
///

function getAffectedArea(pos){
    let checked = 0;
    let page = firstPage;
    let childrenDivs = Array.from(page.text.childNodes.values());
    let targetElement = pos === 0 ? childrenDivs.shift() : null;

    //finding target div
    let lastAdded = 0;
    while (page && checked < pos){
        targetElement = childrenDivs.shift();
        lastAdded = targetElement.textContent.length +
            (targetElement.innerText.match(/\n/g) || []).length +
            (targetElement.querySelector('.default-break') ? -1 : 0);
        checked += lastAdded;
        if (childrenDivs.length === 0 && page.next){
            page = page.next;
            childrenDivs = Array.from(page.text.childNodes.values());
            checked++;
        }
    }
    checked -= lastAdded;

    //finding target span
    let childrenSpans = Array.from(targetElement.childNodes);
    let targetSpan = childrenSpans.shift();
    while (childrenSpans.length > 0 && checked < pos) {
        if (targetSpan.tagName === 'BR')
            lastAdded = 1;
        else
            lastAdded = targetElement.textContent.length +
                (targetElement.innerText.match(/\n/g) || []).length +
                (targetElement.querySelector('.default-break') ? -1 : 0);
        checked += lastAdded;
        targetSpan = childrenSpans.shift();
    }

    return {targetElement, targetSpan, checked};
}

function viewInsertText(text, style, pos){
    let {targetElement, targetSpan, checked} = getAffectedArea(pos);

    let start = targetElement;
    let lastDiv = targetElement;
    let lastSpan = targetSpan;

    let defaultBreak = lastSpan.querySelector('.default-break');

    if (defaultBreak)
        lastSpan.removeChild(defaultBreak);

    let srcText = targetSpan.textContent;
    let splitPos = pos - checked;
    let split0 = checked === pos ? null : srcText.slice(0, splitPos);
    let split1 = checked + targetSpan.innerText.length === pos ? null : srcText.slice(splitPos);
    if (targetSpan.childNodes.length > 0)
        //Array.from(targetSpan.childNodes).reverse().forEach(val => val.remove());
        targetSpan.innerHtml = '';
    if (split0) targetSpan.appendChild(document.createTextNode(split0));
    let nodes = textToNodes(text, targetSpan.tagName === 'br', split1);
    let val = nodes.shift();
    while (val){
        if (val.tagName === 'DIV'){
            lastDiv.after(val);
            lastDiv = val;
            lastSpan = val.lastChild;
        }
        else if (val.nodeName === '#text'){
            lastSpan.appendChild(val);
        }
        else {
            lastSpan.after(val);
            lastSpan = val;
        }
        val = nodes.shift();
    }

    let el = lastDiv;
    do {
        let subEl = el.childNodes[el.childNodes.length - 1];
        while (subEl) {
            if (subEl.tagName === 'SPAN') {
                if (subEl.innerText.length === 0 &&
                    subEl.textContent.length === 0) {
                    if (subEl.nextSibling == null)
                        addDefaultBreak(subEl);
                    else
                        addVerticalBreakPlaceholder(subEl);

                    subEl = subEl.previousSibling;
                }
                else if (subEl.querySelector('.vertical-placeholder') && subEl.textContent.length > 0){
                    subEl.removeChild(subEl.querySelector('.vertical-placeholder'));
                    if (subEl.previousSibling) subEl.before(document.createElement('br'));
                    subEl = subEl.previousSibling;
                }
                else if (subEl.childNodes[0].className === 'default-break'){
                    let tmp = document.createElement('br');
                    tmp.setAttribute('class', 'vertical-placeholder');
                    subEl.childNodes[0].before(tmp);
                    if (subEl.nextSibling)
                        subEl.removeChild(subEl.childNodes[1]);
                    subEl = subEl.previousSibling;
                }
                else {
                    subEl = subEl.previousSibling;
                }
            }
            else if (subEl.tagName === 'BR'){
                if (subEl.nextSibling == null){
                    let tmp = document.createElement('span');
                    if (subEl.previousSibling.tagName === 'SPAN' &&
                        subEl.previousSibling.textContent.length > 0)
                        addVerticalBreakPlaceholder(tmp);
                    addDefaultBreak(tmp);
                    subEl.before(tmp);
                    subEl.remove();
                    subEl = tmp.previousSibling;

                }
                else if (subEl.previousSibling.tagName === 'BR'){
                    let tmp = document.createElement('span');
                    addVerticalBreakPlaceholder(tmp);
                    subEl.before(tmp);
                    subEl.remove();
                    subEl = tmp.previousSibling;
                }
            }
            else {
                subEl = subEl.previousSibling;
            }
        }
        el = el.previousSibling;
    } while (el !== start.previousSibling)

    return lastSpan;
}

function viewDeleteText(pos, size) {
    let {targetElement, targetSpan, checked} = getAffectedArea(pos);
    let toDelete = size;

    let next;
    if (targetSpan.nextSibling)
        next = targetSpan.nextSibling;
    else
        next = targetElement.nextSibling;

    if (pos - checked > 0){
        let str = targetSpan.textContent;
        let split0 = str.slice(0, pos - checked);
        let split1 = str.slice(pos - checked);
        let split2 = '';
        targetSpan.textContent = split0;
        if (toDelete < split1.length){
            split2 = split1.slice(toDelete);
            toDelete = 0;
        }
        else
            toDelete -= split1.length;
        targetSpan.textContent = targetSpan.textContent + split2;
    }
    else
        next = targetSpan;

    let start = targetElement;
    let el = start;
    let end = null;

    while (toDelete > 0){
        let cur = next;
        if (cur.tagName === 'DIV'){
            next = next.childNodes[0];
            end = next;
        }
        else if (cur.tagName === 'SPAN'){
            if (cur.nextSibling)
                next = next.nextSibling;
            else
                next = next.parentElement.nextSibling;

            if (toDelete < cur.textContent){
                cur.innerHtml = cur.textContent.splice(toDelete);
                toDelete = 0;
            }
            else {
                toDelete -= cur.textContent.length;
                cur.remove();
            }
        }
        else if (cur.tagName === 'BR'){
            if (cur.nextSibling)
                next = cur.nextSibling;
            else
                next = cur.parentElement.nextSibling;

            toDelete--;
            cur.remove();
        }
    }

    do {
        if (el.innerText.length === 0 && el.textContent.length === 0) {
            let tmp = el.nextSibling;
            el.remove();
            el = tmp;
        }
        else
            el = el.nextSibling;
    } while (el !== end)

    //TODO: проверять страницы с затронутым контентом
    if (firstPage.text.innerText.length === 0 && firstPage.text.textContent.length === 0)
        addDiv(firstPage.text);
}

function textToNodes(text, afterBreak, attachAtEnd){
    let res = [];
    let split = text.split(/(\n|\v)/g);
    let lastDiv = null;
    let needSpan =  afterBreak || false;

    split.forEach(val => {
        if (val === '\n') {
            lastDiv = document.createElement('div');
            needSpan = true;
            res.push(lastDiv);
        }
        else if (val === '\v') {
            let el = document.createElement('br');
            if (lastDiv)
                lastDiv.appendChild(el);
            else
                res.push(el);
            needSpan = true;
        }
        else{
            let el = document.createTextNode(val);
            if (lastDiv) {
                if (needSpan){
                    const span = document.createElement('span');
                    span.appendChild(el);
                    lastDiv.appendChild(span);
                    needSpan = false;
                }

            }
            else
                res.push(el);
        }
    })

    if (attachAtEnd){
        let el;
        if (needSpan){
            el = document.createElement('span');
            el.appendChild(document.createTextNode(attachAtEnd));
        }
        else {
            el = document.createTextNode(attachAtEnd);
        }

        if (lastDiv)
            lastDiv.appendChild(el);
        else
            res.push(el);
    }

    return res;
}

/*selection = window.getSelection();
range = selection.getRangeAt(0).cloneRange();
start = range.startContainer;
end = range.endContainer;

el = start;
while (el && el.className !== 'text'){
  el = el.parentElement;
}
console.log(el);

el = end;
while (el && el.className !== 'text'){
  el = el.parentElement;
}
console.log(el);

firstPage.text.innerText.length*/

//cursor position in text + visual

function getCaretCoordinates(element) {
    let x = 0,
        y = 0;
    const isSupported = typeof window.getSelection !== "undefined";
    if (isSupported) {
        const selection = window.getSelection();
        // Check if there is a selection (i.e. cursor in place)
        if (selection.rangeCount !== 0) {
            // Clone the range
            const range = selection.getRangeAt(0).cloneRange();
            // Collapse the range to the start, so there are not multiple chars selected
            range.collapse(true);
            // getCientRects returns all the positioning information we need
            let rect = range.getClientRects()[0];
            if (rect){
                const offset = cumulativeOffset(element);
                const drip = element.getBoundingClientRect();
                x = rect.left - drip.left/* + element.offsetLeft*/;
                y = rect.top - drip.top/* + element.offsetTop*/;
            }
            else if (range.startOffset === 0){
                x = range.startContainer.offsetLeft;
                y = range.startContainer.offsetTop;
            }
            else {
                x = range.startContainer.offsetLeft + range.startContainer.offsetWidth;
                y = range.startContainer.offsetTop;
            }
        }
    }
    let res = {x , y};
    console.log(res);
    return res;
}

function cumulativeOffset(element) {
    let top = 0, left = 0;
    do {
        top += element.offsetTop  || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while(element);

    return {top, left};
}

///
///NEW STUFF
///

function appendToTextNode(el, pos, text){
    const srcText = el.textContent;
    const newText = (srcText.slice(0, pos) || '') + text + (srcText.slice(pos) || '');
    el.childNodes.forEach(val => {
        if (val.nodeName === '#text')
            val.remove();
    })
    if (el.childNodes[0])
        el.childNodes[0].before(document.createTextNode(newText));
    else
        el.appendChild(document.createTextNode(newText));
    return el;
}

function removeFromTextNode(el, pos, size){
    const srcText = el.textContent;
    const newText = (srcText.slice(0, pos) || '') + (srcText.slice(pos + size) || '');
    el.childNodes.forEach(val => {
        if (val.nodeName === '#text')
            val.remove();
    })
    if (el.childNodes[0])
        el.childNodes[0].before(document.createTextNode(newText));
    else
        el.appendChild(document.createTextNode(newText));
    return el;
}

function createNewTextNode(el, text, style, isBefore, isChild){
    const tmp = document.createElement('span');
    //TODO: styling
    if (text) tmp.appendChild(document.createTextNode(text));
    if (isChild){
        el.appendChild(tmp);
    }
    else {
        if (isBefore)
            el.before(tmp);
        else
            el.after(tmp);
    }
    return tmp;
}

function addNewLine(el, isBefore){

}
function addParagraph(el, text, style, isBefore){
    const tmp = document.createElement('div');
    const span = document.createElement('span');
    if (text) span.appendChild(document.createTextNode(text));
    const br = document.createElement('br');
    br.setAttribute('class', 'newline');
    span.appendChild(br);
    tmp.appendChild(span);
    //TODO: styling
    if (isBefore)
        el.before(tmp);
    else
        el.after(tmp);
    return tmp;
}

///
//showing username next to cursor
///
function toggleTooltip(event, contenteditable) {
    const tooltip = document.getElementById("tooltip");
    if (contenteditable.contains(event.target)) {
        const { x, y } = getCaretCoordinates(contenteditable);
        tooltip.setAttribute("aria-hidden", "false");
        tooltip.setAttribute(
            "style",
            `display: inline-block; left: ${x}px; top: ${y - 20}px`
        );
        tooltip.setAttribute('style', tooltip.getAttribute('style') + ';background-color: ' + colours.get('MollyZen'))
    } else {
        tooltip.setAttribute("aria-hidden", "true");
        tooltip.setAttribute("style", "display: none;");
    }
}

///
//colours for users/cursors
///
function getHashOfString (str){
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    return hash;
}
function normalizeHash(hash, min, max){
    return Math.floor((hash % (max - min)) + min);
}

function generateHSL(name) {
    const hRange = [0, 360];
    const sRange = [50, 75];
    const lRange = [25, 60];

    const hash = getHashOfString(name);
    const h = normalizeHash(hash, hRange[0], hRange[1]);
    const s = normalizeHash(hash, sRange[0], sRange[1]);
    const l = normalizeHash(hash, lRange[0], lRange[1]);
    return [h, s, l];
}

function HSLtoString(hsl){
    return `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
}

function testColourToConsole(str){
    let hsl = HSLtoString(generateHSL(str));
    console.log('%c ' + str, 'background-color: ' + hsl);
}