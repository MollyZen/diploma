var pane;

function setPane(newPane) {
    pane = newPane;
}

function initPages(){
    var prev = addPage(null, null);
    /*var el = document.getElementById("editable")
    var range = document.createRange()
    var sel = window.getSelection()

    range.setStart(el.childNodes[2], 5)
    range.collapse(true)

    sel.removeAllRanges()
    sel.addRange(range)*/
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
    const pageWidth = '210mm';
    const pageHeight = '297mm';

    const topMargin = '25.4mm';
    const bottomMargin = '25.4mm';
    const leftMargin = '25.4mm';
    const rightMargin = '25.4mm';

    const newPage = document.createElement("div");
    newPage.setAttribute('style', 'background-color: white; margin:0; padding:0; overflow:hidden;');
    newPage.setAttribute('style', newPage.getAttribute('style')+'; width: ' + pageWidth);
    newPage.setAttribute('style', newPage.getAttribute('style')+'; height: ' + pageHeight);
    newPage.setAttribute('class', 'A4');

    const margins = document.createElement("div");
    margins.setAttribute('style', 'margin-left: ' + topMargin);
    margins.setAttribute('style', margins.getAttribute('style')+'; margin-right: ' + rightMargin);
    margins.setAttribute('style', margins.getAttribute('style')+'; margin-top: ' + leftMargin);
    margins.setAttribute('style', margins.getAttribute('style')+'; margin-bottom: ' + bottomMargin);

    const text = document.createElement('div');
    text.setAttribute('class', 'text');
    text.setAttribute('contenteditable', 'true');
    text.setAttribute('style', 'outline: 0px solid transparent; overflow: hidden; white-space: pre-wrap;');
    const calcStatement = 'calc(' + pageHeight + ' - ' + topMargin + ' - ' + bottomMargin + ');';
    text.setAttribute('style', text.getAttribute('style') + ';max-height:' + calcStatement + ')');
    text.setAttribute('style', text.getAttribute('style') + ';height:' + calcStatement + ')');

    addDiv(text);

    margins.appendChild(text);
    newPage.appendChild(margins);

    const obj = new Page(newPage, margins, text, prevPage, nextPage);

    text.addEventListener('keydown', function (ev){
        if (ev.key === 'Backspace'){
            if (obj.prev) {
                if (text.innerText.length === 0) {
                    var prevText = obj.prev.text;
                    prevText.focus();

                    var selectedText = window.getSelection();
                    var selectedRange = document.createRange();
                    selectedRange.setStart(prevText, prevText.innerText);
                    selectedRange.collapse(true);

                    selectedText.removeAllRanges();
                    selectedText.addRange(selectedRange);
                    obj.prev.text.focus();
                    try {
                        return false;
                    } finally {
                        removePage(obj);
                    }
                }
            }
            else {
                if (obj.text.innerText.length === 1 && obj.text.innerText[0].charCodeAt(0) === 10){
                    ev.preventDefault();
                }
            }
        }
        else if (ev.key === 'Enter'){
            if (!ev.shiftKey){
                ev.preventDefault();

                let parent;
                if (window.getSelection().anchorNode.tagName === 'BR' || window.getSelection().anchorNode.nodeName === '#text')
                    parent = window.getSelection().anchorNode.parentElement;
                else
                    parent =  window.getSelection().anchorNode;

                if (parent.tagName === 'DIV'){
                    const ch  = window.getSelection().anchorNode.childNodes;
                    parent = ch[ch.length - 1];
                }


                /*let _range = document.getSelection().getRangeAt(0)
                let range = _range.cloneRange()
                range.selectNodeContents(parent)
                range.setEnd(_range.endContainer, _range.endOffset)
                let offset = range.toString().length;*/
                let offset = getCaretPosition(parent);

                const newDiv = addDiv(parent.parentElement, true);
                if (parent.textContent.length !== offset) {
                    const text = parent.childNodes[0].textContent;
                    parent.removeChild(parent.childNodes[0]);
                    let lastId = parent.childNodes.length;
                    let textNode = document.createTextNode(text.slice(0, offset));
                    if (parent.childNodes[0])
                        parent.childNodes[0].before(textNode);
                    else
                        parent.appendChild(textNode);
                    newDiv.childNodes[0].insertAdjacentText('afterbegin', text.slice(offset));
                }
                setCaret(this, newDiv, 1);
            }
            else{
                ev.preventDefault();

                let parent;
                if (window.getSelection().anchorNode.tagName === 'br' || window.getSelection().anchorNode.nodeName === '#text') {
                    parent = window.getSelection().anchorNode.parentElement;
                }
                else
                    parent =  window.getSelection().anchorNode;

                let _range = document.getSelection().getRangeAt(0)
                let range = _range.cloneRange()
                range.selectNodeContents(parent)
                range.setEnd(_range.endContainer, _range.endOffset)
                let offset = range.toString().length;

                const text = parent.childNodes[0].textContent;
                parent.removeChild(parent.childNodes[0]);
                const node0 = document.createTextNode(text.slice(0, offset));
                const node1 = document.createElement('br');
                const node2 = document.createTextNode(text.slice(offset));
                if (parent.childNodes[0])
                    parent.childNodes[0].before(node0, node1, node2);
                else {
                    parent.appendChild(node0);
                    parent.appendChild(node1);
                    parent.appendChild(node2);
                }
            }
        }
        toggleTooltip(ev, text);
    })
    text.addEventListener('beforeinput', function (e){
        /*if (ev.rangeParent.innerText && ev.rangeParent.innerText.length === 1 && ev.rangeParent.innerText[0].charCodeAt(0) === 10) {
            ev.rangeParent.innerText = '';
        }
        const curHeight = text.getAttribute('height');*/
        //sendChanges(ev.target, ev.target.value, null, null);
        /*const children = e.rangeParent.childNodes;
        const lastChild = children[children.length - 1];
        if (lastChild && lastChild.classList.contains('default-break'))
            e.rangeParent.removeChild(lastChild);*/
    })
    text.addEventListener('input', (ev) => {
        toggleTooltip(ev, text);
    })
    text.addEventListener('overflow', function (ev){
        const nextPage = addPage(obj, null);
        nextPage.text.focus();
        ev.preventDefault();
        return false;
    })
    text.addEventListener('click', (e) => {
        getCaretIndex(text);
        toggleTooltip(e, text);
    })

    if (prevPage) {
        prevPage.page.after(newPage);
        addPageBreak(prevPage);
    }
    else {
        pane.appendChild(newPage);
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
function addDiv(anchorElement, isAfter){
    const defaultParagraph = document.createElement('div');
    const span = document.createElement('span');
    addDefaultBreak(span);
    defaultParagraph.appendChild(span);
//    anchorElement.appendChild(defaultParagraph);
    if (isAfter)
        anchorElement.after(defaultParagraph);
    else
        anchorElement.appendChild(defaultParagraph);
    return defaultParagraph;
}

//cursor position in text + visual
function getCaretIndex(element) {
    let position = 0;
    const isSupported = typeof window.getSelection !== "undefined";
    if (isSupported) {
        const selection = window.getSelection();
        if (selection.rangeCount !== 0) {
            const range = window.getSelection().getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            position = preCaretRange.toString().length;
        }
    }
    console.log(position);
    return position;
}

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
                x = rect.left - drip.left + element.offsetLeft;
                y = rect.top - drip.top + element.offsetTop;
            }
            else{
                x = range.startContainer.offsetLeft;
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

//showing username next to cursor
function toggleTooltip(event, contenteditable) {
    const tooltip = document.getElementById("tooltip");
    if (contenteditable.contains(event.target)) {
        const { x, y } = getCaretCoordinates(contenteditable);
        tooltip.setAttribute("aria-hidden", "false");
        tooltip.setAttribute(
            "style",
            `display: inline-block; left: ${x}px; top: ${y - 20}px`
        );
    } else {
        tooltip.setAttribute("aria-hidden", "true");
        tooltip.setAttribute("style", "display: none;");
    }
}

//colours for users/cursors
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