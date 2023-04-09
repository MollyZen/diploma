var pane;

function setPane(newPane) {
    pane = newPane;
}

function initPages(){
    var prev = addPage(null, null);
    var cur = addPage(prev, null);
    removePage(cur);
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

    const defaultDiv = document.createElement('div');
    defaultDiv.appendChild(document.createElement('br'));
    text.appendChild(defaultDiv);

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

    margins.appendChild(text);
    newPage.appendChild(margins);

    const obj = new Page(newPage, margins, text, prevPage, nextPage);

    if (prevPage) {
        prevPage.page.after(newPage);
        addPageBreak(prevPage);
    }
    else {
        pane.appendChild(newPage);
    }

    return obj;
}

function addPageBreak(page){
    const pageBreak = document.createElement("div");
    pageBreak.setAttribute('style', 'height: 30px;');
    page.page.after(pageBreak);
    page.break = pageBreak;

    return pageBreak;
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

function removePageBreak(page) {
    page.break.remove();
    page.break = null;
}