var pane;
const pages = [];
const breaks = [];

function setPane(newPane) {
    pane = newPane;
}

function initPages(){
    addPage();
    addPage();
    removePage(0);
}

function addPage(){
    var pageWidth = '210mm';
    var pageHeight = '297mm';

    const newPage = document.createElement("div");
    newPage.setAttribute('contenteditable', 'true');
    newPage.setAttribute('style', 'background-color: white; margin:0; padding:0; overflow:hidden; outline: 0px solid transparent;');
    newPage.setAttribute('style', newPage.getAttribute('style')+'; width: ' + pageWidth);
    newPage.setAttribute('style', newPage.getAttribute('style')+'; height: ' + pageHeight);
    newPage.setAttribute('class', 'A4');

    const margins = document.createElement("div");
    margins.setAttribute('style', 'margin-left: 25.4mm;');
    margins.setAttribute('style', margins.getAttribute('style')+'; margin-right: 25.4mm;');
    margins.setAttribute('style', margins.getAttribute('style')+'; margin-top: 25.4mm;');
    margins.setAttribute('style', margins.getAttribute('style')+'; margin-bottom: 25.4mm;');

    const text = document.createElement('div');

    margins.appendChild(text);
    newPage.appendChild(margins);

    if (pages.length > 0) addPageBreak();
    pages.push(newPage);
    pane.appendChild(newPage);

    return newPage;
}

function addPageBreak(){
    const pageBreak = document.createElement("div");
    pageBreak.setAttribute('style', 'height: 30px;');
    breaks.push(pageBreak);
    pane.appendChild(pageBreak);

    return pageBreak;
}

function removePage(idx) {
    if (idx > 0)
        removePageBreak(idx - 1);
    else if (pages.length > 1) {
        removePageBreak(0);
    }
    pages.splice(idx, 1)[0].remove();
}

function removePageBreak(idx) {
    breaks.splice(idx,1)[0].remove();
}
