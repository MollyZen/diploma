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

    const defaultParagraph = document.createElement('div');
    defaultParagraph.appendChild(document.createElement('br'));
    text.appendChild(defaultParagraph);

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
    })
    text.addEventListener('beforeinput', function (ev){
        if (ev.rangeParent.innerText && ev.rangeParent.innerText.length === 1 && ev.rangeParent.innerText[0].charCodeAt(0) === 10) {
            ev.rangeParent.innerText = '';
        }
        const curHeight = text.getAttribute('height');
    })
    text.addEventListener('overflow', function (ev){
        const nextPage = addPage(obj, null);
        nextPage.text.focus();
        ev.preventDefault();
        return false;
    })
    text.addEventListener('click', (e) => {
        getCaretIndex(text);
        getCaretCoordinates();
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

function addDiv(anchorElement, isBefore){
    const defaultParagraph = document.createElement('div');
    defaultParagraph.appendChild(document.createElement('br'));

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

function getCaretCoordinates() {
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
            const rect = range.getClientRects()[0];
            if (rect) {
                x = rect.left; // since the caret is only 1px wide, left == right
                y = rect.top; // top edge of the caret
            }
            else {
                /*x =
                    y =*/
            }
        }
    }
    console.log({x,y});
    return { x, y };
}

//showing usersname next to cursor
function toggleTooltip(event, contenteditable) {
    const tooltip = document.getElementById("tooltip");
    if (contenteditable.contains(event.target)) {
        const { x, y } = getCaretCoordinates();
        tooltip.setAttribute("aria-hidden", "false");
        tooltip.setAttribute(
            "style",
            `display: inline-block; left: ${x - 32}px; top: ${y - 36}px`
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