const modelViewRelMap = new Map();

const SPAN_SIZE_LIMIT = 32;
const ROPE_NODE_SIZE_LIMIT = 4;

function initController() {
    //init model
    const modelEl = ropeInsertText('\n', null, 0).added[0];

    //init view
    const initialBreak = document.createElement('br');
    initialBreak.setAttribute('class', 'newline');

    const initialSpan = document.createElement('span');
    initialSpan.setAttribute('style', 'font-size:calc(1/72*' + fontSize + 'in)');
    initialSpan.setAttribute('style', initialSpan.getAttribute('style') + ';display:inline-block');
    initialSpan.setAttribute('style', initialSpan.getAttribute('style') + ';min-height:calc(1/72*' + fontSize + 'in)');
    initialSpan.appendChild(initialBreak);

    const initialParagraph = document.createElement('div');
    initialParagraph.appendChild(initialSpan);

    pane.appendChild(initialParagraph);

    //init relation between them
    modelViewRelMap.set(modelEl, initialSpan);
    modelViewRelMap.set(initialSpan, [modelEl]);
}

function testChangesDisplay() {

    //ropeRoot.deleteLeft();
    //ropeRoot.deleteRight();

    insertText('govno ', null, 0);
    insertText('zhopa ', null, 0);
    insertText('suka ', null, 0);

    insertText('blya', null, 17);

    /*controllerInsert('after suka ', null, 5);
    controllerInsert('aaa ', null, 16);

    controllerInsert('sss', null, 1);*/

}

function controllerInsert(text, style, pos){
    ropeInsertText(text, style, pos);
    viewInsertText(text, style, pos);
}

function validateModelView() {
    let modelString = getFullString(ropeRoot);
    let viewString = '';

    let page = firstPage;
    let addNewLine = false;
    while (page){
        let nodes = Array.from(page.text.childNodes);
        while (nodes.length > 0){
            if (addNewLine)
                viewString = viewString + '\n';
            let node = nodes.shift();
            if (node.tagName === 'BR')
                viewString = viewString + '\v';
            else
                viewString = viewString + node.textContent;
            addNewLine = true;
        }

        page = page.next;
    }

    return modelString === viewString;
}

//inputHandling
function handleTextInput(text, style, pos){
    text.split(/(\n|\v)/g).forEach(val => {
        if (val === '\n'){
            insertNewLine(pos);
        }
        else if (val === '\v'){
        }
        else
            insertText(text, style, pos);
    })
}
function insertText(text, style, pos){
    let {added, removed} = ropeInsertText(text, style, pos);
    //TODO: проверка на стиль в первом пункте
    if (removed.length > 0){
        let oldView = modelViewRelMap.get(removed[0]);
        let oldMod = modelViewRelMap.get(oldView);
        let id = oldMod.findIndex(val => val === removed[0]);

        modelViewRelMap.delete(removed[0]);
        let newArr = oldMod;
        let offset = newArr[0].getOffset();
        if (oldView.textContent.length + text.length <= SPAN_SIZE_LIMIT){
            newArr.splice(id, 1, added);
            appendToTextNode(oldView, pos - offset, text);
            modelViewRelMap.set(oldView, newArr);
            added.forEach(val => modelViewRelMap.set(val, oldView));
        }
        else {
            let newView = createNewTextNode(oldView, null, null, false);
            let newViewArr = [];
            removeFromTextNode(oldView, pos - offset, added[2].text.length);
            if (oldView.textContent.length + text.length - added[2].text.length <= SPAN_SIZE_LIMIT){
                newArr.splice(id, 1, added.splice(2, 1));
                modelViewRelMap.set(oldView, newArr);
                modelViewRelMap.set(added[0], oldView);
                modelViewRelMap.set(added[1], oldView);
            }
            else {
                newArr.splice(id, 1, added[0]);
                modelViewRelMap.set(oldView, newArr);
                modelViewRelMap.set(added[0], oldView);

                appendToTextNode(newView, 0, added[1].text);
                modelViewRelMap.set(added[1], newView);
                newViewArr.push(added[1]);
            }
            appendToTextNode(newView, newView.textContent.length, added[2].text);
            newViewArr.push(added[2]);
            modelViewRelMap.set(added[2], newView);
            modelViewRelMap.set(newView, newViewArr);
        }
    }
    else {
        let prevEl = added[0].prevTextNode();
        let nextEl = added[0].nextTextNode();
        let done = false;
        if (prevEl && (prevEl.style || []).join(',') === (style || []).join(',')){
            let view = modelViewRelMap.get(prevEl);
            if (view.textContent.length + text.length <= SPAN_SIZE_LIMIT){
                let viewNodes = modelViewRelMap.get(view);

                const offset = prevEl.getOffset();
                appendToTextNode(view, offset + prevEl.text.length, text);

                const id = viewNodes.findIndex(val => val === prevEl);
                modelViewRelMap.set(added[0], view);
                viewNodes.splice(id + 1, 0, added[0])
                modelViewRelMap.set(view, viewNodes);
                done = true;
            }
        }
        if (!done && nextEl && (nextEl.style || []).join(',') === (style || []).join(',')){
            let view = modelViewRelMap.get(nextEl);
            if (view.textContent.length + text.length <= SPAN_SIZE_LIMIT) {
                let viewNodes = modelViewRelMap.get(view);

                const offset = nextEl.getOffset();
                appendToTextNode(view, offset - text.length, text);

                const id = viewNodes.findIndex(val => val === nextEl);
                modelViewRelMap.set(added[0], view);
                viewNodes.splice(id, 0, added[0]);
                modelViewRelMap.set(view, viewNodes);
                done = true;
            }
        }
        if (!done){
            let newView;
            if (prevEl){
                let view = modelViewRelMap.get(prevEl);
                newView = createNewTextNode(view, text, style, false);
            }
            else if (nextEl){
                let view = modelViewRelMap.get(nextEl);
                newView = createNewTextNode(view, text, style, true);
            }
            modelViewRelMap.set(added[0], newView);
            modelViewRelMap.set(newView, [added[0]]);
        }

    }
}

function insertNewLine(pos){
    let {added, removed} = ropeInsertText('\n', null, pos);

    let newPar;
    if (removed.length > 0){
        const cutPos = added[0].getOffset() + added[0].text.length;

        const oldView = modelViewRelMap.get(removed[0]);
        const oldViewEls = modelViewRelMap.get(oldView);
        const id = oldViewEls.findIndex(val => val === removed[0]);
        const oldBr = oldViewEls.pop();
        oldViewEls.splice(id, 1, added[0]);
        oldViewEls.push(added[1]);
        removeFromTextNode(oldView, added[0].getLength(), added[2].getLength());

        let {first, second} = splitString(oldView.textContent, cutPos);

        newPar = addParagraph(oldView.parentNode, null, null, false);
        modelViewRelMap.delete(removed[0]);
        modelViewRelMap.set(oldView, oldViewEls);
        modelViewRelMap.set(added[1], oldView);

        modelViewRelMap.set(oldBr, newPar.childNodes[0]);
        modelViewRelMap.set(newPar.childNodes[0], [oldBr]);
        let el = oldView.nextSibling;
        let modelEls = modelViewRelMap.get(el);
        if (modelEls && (modelEls[0].style || []).join(',') === (added[2].style || []).join(',') && el.textContent.length + added[2].length <= SPAN_SIZE_LIMIT){
            modelEls.splice(0,0,added[2]);
            appendToTextNode(el, 0, added[2].text);
            modelViewRelMap.set(added[2], el);
            modelViewRelMap.set(el, modelEls);
        } else{
            appendToTextNode(newPar.childNodes[0], 0, added[2].text);
            modelViewRelMap.set(added[2], newPar.childNodes[0]);
            modelViewRelMap.set(newPar.childNodes[0], [added[2]]);
        }
        while (el){
            el.remove();
            newPar.appendChild(el);
            el = el.nextSibling;
        }
    }
    else {
        let prevEl = added[0].prevTextNode();
        let nextEl = added[0].nextTextNode();
        if (prevEl && prevEl.text === '\n') {
            newPar = addParagraph(modelViewRelMap.get(prevEl).parentNode, null, null, false);
            modelViewRelMap.set(added[0], newPar.childNodes[0]);
            modelViewRelMap.set(newPar.childNodes[0], [added[0]]);
        }
        else if (nextEl && nextEl.text === '\n') {
            newPar = addParagraph(modelViewRelMap.get(nextEl).parentNode, null, null, true);
            modelViewRelMap.set(added[0], newPar.childNodes[0]);
            modelViewRelMap.set(newPar.childNodes[0], [added[0]]);
        }
        else {
            if (prevEl){

            }
        }
    }
}

function insertLineBreak(pos){
    let {added, removed} = ropeInsertText('\v', null, pos);

}

//util
function getViewCaretIndex(){
    const selection = window.getSelection();
    if (selection.rangeCount !== 0){
        const range = window.getSelection().getRangeAt(0);
        const preCaretRange = range.cloneRange();
        let start = preCaretRange.startContainer;
        let end = preCaretRange.endContainer;

        let isText = start.nodeName === '#text';
        let startNode = isText ? start.parentNode : start;
        let modelNode = modelViewRelMap.get(startNode);
        let before = modelNode[0].getOffset();
        if (isText)
            before += preCaretRange.startOffset;
        else
            before+= startNode.textContent.length;
        /*if (!isText)
            before += startNode.textContent.length;*/

        return before;
    }
    else
        return -1;
}