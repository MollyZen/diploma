const modelViewRelMap = new Map();

const SPAN_SIZE_LIMIT = 6;
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

    handleTextInput('govno ', null, 0);
    handleTextInput('zhopa ', null, 0);
    handleTextInput('suka ', null, 0);

    handleTextInput('blya', null, 17);

    handleTextInput('after suka ', null, 5);
    handleTextInput('aaa ', null, 16);

    handleTextInput('sss', null, 1);

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
            insertLineBreak(pos);
        }
        else if (val.length > 0)
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
        let offset = added[0].getOffset();
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
            if (oldView.textContent.length + text.length <= SPAN_SIZE_LIMIT){
                newArr.splice(id, 1, added[0], added[1]);
                modelViewRelMap.set(oldView, newArr);
                modelViewRelMap.set(added[0], oldView);
                modelViewRelMap.set(added[1], oldView);
                appendToTextNode(oldView, oldView.textContent.length, added[1].text);
            }
            else {
                newArr.splice(id, 1, added[0]);
                modelViewRelMap.set(oldView, newArr);
                modelViewRelMap.set(added[0], oldView);
                modelViewRelMap.set(added[1], newView);
                appendToTextNode(newView, 0, added[1].text);
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
        if (prevEl /*&& !prevEl.text.match(/(\n|\v)/g)*/ && (prevEl.style || []).join(',') === (style || []).join(',')){
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
        if (!done /*&& nextEl && !nextEl.text.match(/(\n|\v)/g)*/ && (nextEl.style || []).join(',') === (style || []).join(',')){
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
        let view = modelViewRelMap.get(removed[0]);
        let viewEls = modelViewRelMap.get(view);
        newPar = addParagraph(view.parentElement, null, null, true);
        newPar.childNodes[0].remove();
        let el = view.previousSibling;
        while (el){
            if (newPar.childNodes[0] == null)
                newPar.appendChild(el);
            else
                newPar.childNodes[0].before(el);
            el = el.previousSibling;
        }
        let [first, second] = splitString(view.textContent, pos - added[0].getOffset());
        const id = viewEls.findIndex(val => val === removed[0]);
        const lastPart = viewEls.splice(id, viewEls.length - id, added[0]);
        lastPart.splice(0,0, added[2]);
        let newTextNode = createNewTextNode(newPar, first, null, false, true);
        removeFromTextNode(view, 0, first.length);
        viewEls.push(added[1]);
        viewEls.forEach(val => modelViewRelMap.set(val, newTextNode));

        modelViewRelMap.delete(removed[0]);
        modelViewRelMap.set(added[2], view);
        modelViewRelMap.set(newTextNode, viewEls);
        modelViewRelMap.set(view, lastPart);
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
            const prevView = modelViewRelMap.get(prevEl);
            const prevViewEls = modelViewRelMap.get(prevView);

            const nextView = modelViewRelMap.get(nextEl);
            const nextViewEls = modelViewRelMap.get(nextView);

            if (prevView === nextView){
                newPar = addParagraph(prevView.parentElement, null, null, true);
                const id = prevViewEls.findIndex(val => val === prevEl);
                const lastPart = prevViewEls.splice(id + 1, prevViewEls.length - id - 1);
                prevViewEls.forEach(val => {
                    modelViewRelMap.set(val, newPar.childNodes[0]);
                })
                prevViewEls.push(newPar.childNodes[0]);
                const textBefore = prevView.textContent.slice(0, lastPart[0].getOffset() - 1);
                appendToTextNode(newPar.childNodes[0], 0, textBefore);
                removeFromTextNode(prevView, 0, textBefore.length);
                let tmp = prevView.previousSibling;
                while (tmp)
                    newPar.childNodes[0].before(tmp);

                modelViewRelMap.set(prevView, lastPart);
                modelViewRelMap.set(newPar.childNodes[newPar.childNodes.length - 1], prevViewEls);
                modelViewRelMap.set(added[0], newPar.childNodes[newPar.childNodes.length - 1]);
            }
            else {
                newPar = addParagraph(prevView.parentElement, null, null, true);
                newPar.childNodes[0].remove();
                let el = prevView.previousSibling;
                while (el){
                    if (newPar.childNodes[0] == null)
                        newPar.appendChild(el);
                    else
                        newPar.childNodes[0].before(el);
                    el = el.previousSibling;
                }
                const br = document.createElement('br');
                br.setAttribute('class', 'newline');
                prevView.appendChild(br);
                newPar.appendChild(prevView);
                prevViewEls.push(added[0]);
                modelViewRelMap.set(prevView, prevViewEls);
                modelViewRelMap.set(added[0], prevView);
            }
        }
    }
}

function insertLineBreak(pos){
    let {added, removed} = ropeInsertText('\v', null, pos);
    if (removed.length > 0) {
        const view = modelViewRelMap.get(removed[0]);
        const viewEls = modelViewRelMap.get(view);

        const newTextNode = createNewTextNode(view, null, null, true, false);

        const id = viewEls.findIndex(val => val === removed[0]);
        viewEls.splice(id, 1);
        const lastEls = viewEls.splice(id, viewEls.length - id);
        viewEls.push(added[0]);
        viewEls.push(added[1]);
        lastEls.unshift(added[2]);

        const [first, second] = splitString(view.textContent, pos - added[0].getOffset());
        appendToTextNode(newTextNode, 0, first);
        removeFromTextNode(view, 0, first.length);

        const br = document.createElement('br');
        br.setAttribute('class', 'vertical-break');
        newTextNode.appendChild(br);

        viewEls.forEach(val => modelViewRelMap.set(val, newTextNode));
        lastEls.forEach(val => modelViewRelMap.set(val, view));
        modelViewRelMap.delete(removed[0]);
        modelViewRelMap.set(newTextNode, viewEls);
        modelViewRelMap.set(view, lastEls);
    }
    else {
        let prevEl = added[0].prevTextNode();
        let nextEl = added[0].nextTextNode();

        const prevView = modelViewRelMap.get(prevEl);
        const prevViewEls = modelViewRelMap.get(prevView);

        const nextView = modelViewRelMap.get(nextEl);

        if (prevView === nextView){
            const newTextNode = createNewTextNode(prevView, null, null, true, false);

            const id = prevViewEls.findIndex(val => val === prevEl);
            const lastEls = prevViewEls.splice(id + 1, prevViewEls.length - id - 1);

            const [first, second] = splitString(prevView.textContent, pos - (prevViewEls.length > 0 ? prevViewEls[0].getOffset() : 0));
            appendToTextNode(newTextNode, 0, first);
            removeFromTextNode(prevView, 0, first.length);

            const br = document.createElement('br');
            br.setAttribute('class', 'vertical-break');
            newTextNode.appendChild(br);

            prevViewEls.push(added[0]);
            prevViewEls.forEach(val => modelViewRelMap.set(val, newTextNode));
            modelViewRelMap.set(prevView, lastEls);
            modelViewRelMap.set(newTextNode, prevViewEls);
        }
        else {
            const br = document.createElement('br');
            br.setAttribute('class', 'vertical-break');
            prevView.append(br);

            prevViewEls.push(added[0]);
            modelViewRelMap.set(added[0], prevView);
            modelViewRelMap.set(prevView, prevViewEls);
        }
    }
}

function deleteText(pos, length){
    let changed = ropeDeleteText(pos, length); // {el, before}

    changed.forEach(val => {
        let view = modelViewRelMap.get(val.el);
        let viewEls = modelViewRelMap.get(view);
        let id = viewEls.findIndex(vall => vall === val.el);

        if (val.before === '\n') {

        }
        else if (val.before === '\v') {
            view.childNodes[view.childNodes.length - 1].remove();
            viewEls.splice(id, 1);
            modelViewRelMap.delete(val.el);
        }
        else {
            let offset = viewEls[id - 1] ? viewEls[id - 1].getOffset() : 0;
            if (val.el.text) {
                removeFromTextNode(view, offset, val.before.length);
                appendToTextNode(view, offset, val.el.text);
            }
            else {
                removeFromTextNode(view, offset, val.before.length);
                viewEls.splice(id, 1);
                modelViewRelMap.delete(val.el);
            }
        }
        if (viewEls.length > 0)
            modelViewRelMap.set(view, viewEls);
        else {
            modelViewRelMap.delete(view);
            view.remove();
        }
    })
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

        return before;
    }
    else
        return -1;
}