const pages = document.getElementById("pane");

function initPages(){
    var pageWidth = '210mm';
    var pageHeight = '297mm';
    //editor page itself
    const myIFrame = document.getElementById("pane");

    var pane = document.getElementById('pane');

    var el = document.createElement("div");
    el.setAttribute('contenteditable', true);
    el.setAttribute('style', 'background-color: white; margin:0; padding:0; overflow:hidden; outline: 0px solid transparent;');
    el.setAttribute('style', el.getAttribute('style')+'; width: ' + pageWidth);
    el.setAttribute('style', el.getAttribute('style')+'; height: ' + pageHeight);
    el.setAttribute('class', 'A4');
    var ell = document.createElement("div");
    ell.setAttribute('style', 'margin-left: 25.4mm;');
    ell.setAttribute('style', ell.getAttribute('style')+'; margin-right: 25.4mm;');
    ell.setAttribute('style', ell.getAttribute('style')+'; margin-top: 25.4mm;');
    ell.setAttribute('style', ell.getAttribute('style')+'; margin-bottom: 25.4mm;');
    var elll = document.createElement('div');
    elll.textContent = 'AMOGUS DRIPPPP';
    ell.appendChild(elll);
    el.appendChild(ell);
    pane.appendChild(el);
}

function addPage(){

}