const modelViewRelMap = new Map();

const SPAN_SIZE_LIMIT = 256;
const ROPE_NODE_SIZE_LIMIT = 4;

const actionHistory = [];

function initController() {
    //init model
    const modelEl = ropeInsertText('\n', null, 0).added[0];

    //init view
    const initialBreak = document.createElement('br');
    initialBreak.setAttribute('class', 'newline');

    const initialSpan = document.createElement('span');
    initialSpan.appendChild(initialBreak);

    const initialParagraph = document.createElement('div');
    initialParagraph.appendChild(initialSpan);

    pane.appendChild(initialParagraph);

    //init relation between them
    modelViewRelMap.set(modelEl, initialSpan);
    modelViewRelMap.set(initialSpan, [modelEl]);
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
    text.split(/(\n|\v|\t)/g).forEach(val => {
        if (val === '\n')
            insertNewLine(pos);
        else if (val === '\v')
            insertLineBreak(pos);
        else if (val === '\t')
            insertTab(pos);
        else if (val.length > 0)
            insertText(text, style, pos);
    })
    //document.getElementById("sym_count").textContent = getLetterCount();
}
function insertText(text, style, pos){
    let {added, removed} = ropeInsertText(text, style, pos);
    if (removed.length > 0){
        let oldView = modelViewRelMap.get(removed[0]);
        let oldMod = modelViewRelMap.get(oldView);
        let id = oldMod.findIndex(val => val === removed[0]);

        modelViewRelMap.delete(removed[0]);
        let newArr = oldMod;
        let offset = added[0].getOffset();
        if (style === removed[0].style && oldView.textContent.length + text.length <= SPAN_SIZE_LIMIT){
            newArr.splice(id, 1, ...added);
            appendToTextNode(oldView, pos - offset, text);
            modelViewRelMap.set(oldView, newArr);
            added.forEach(val => modelViewRelMap.set(val, oldView));
        }
        else {
            let newView = createNewTextNode(oldView, null, added[2].style, false);
            let newViewArr = [];
            removeFromTextNode(oldView, pos - offset, added[2].text.length);
            if (style === removed[0].style && oldView.textContent.length + text.length <= SPAN_SIZE_LIMIT){
                newArr.splice(id, 1, added[0], added[1]);
                modelViewRelMap.set(oldView, newArr);
                modelViewRelMap.set(added[0], oldView);
                modelViewRelMap.set(added[1], oldView);
                appendToTextNode(oldView, oldView.textContent.length, added[1].text);
            }
            else if (style === added[2].style){
                newArr.splice(id, 1, added[0]);
                modelViewRelMap.set(oldView, newArr);
                modelViewRelMap.set(added[0], oldView);
                modelViewRelMap.set(added[1], newView);
                appendToTextNode(newView, 0, added[1].text);
                newViewArr.push(added[1]);
            }
            else {
                newArr.splice(id, 1, added[0]);
                modelViewRelMap.set(oldView, newArr);
                modelViewRelMap.set(added[0], oldView);

                let newNewView = createNewTextNode(oldView, added[1], style, false, false);
                modelViewRelMap.set(newNewView, [added[1]]);
                modelViewRelMap.set(added[1], newNewView);
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
        if (prevEl && prevEl.style === style){
            let view = modelViewRelMap.get(prevEl);
            if (view.textContent.length + text.length <= SPAN_SIZE_LIMIT){
                let viewNodes = modelViewRelMap.get(view);

                const offset = viewNodes[0].getOffset();
                appendToTextNode(view, pos - offset, text);

                const id = viewNodes.findIndex(val => val === prevEl);
                modelViewRelMap.set(added[0], view);
                viewNodes.splice(id + 1, 0, added[0])
                modelViewRelMap.set(view, viewNodes);
                done = true;
            }
        }
        if (!done && nextEl.style  === style){
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
            let prevView = modelViewRelMap.get(prevEl);
            let nextView = modelViewRelMap.get(nextEl);


            if (nextEl && (nextEl.text === '\n' || nextEl.text === '\v')){
                const nextEls = modelViewRelMap.get(nextView);
                if (nextEls.length === 1){
                    clearFormatting(nextView);
                    appendToTextNode(nextView, 0, text);
                    nextEls.unshift(added[0]);
                    if (style)
                        styleStringToArr(style)
                            .forEach(val => applyFormattingToElement(nextView, val.code, val.value));
                    modelViewRelMap.set(nextView, nextEls);
                    modelViewRelMap.set(added[0], nextView);
                }
                else{
                    newView = createNewTextNode(nextView, text, style, false, false);
                    const br = nextEls.pop();
                    const lastChild = nextView.lastChild;
                    lastChild.remove();
                    newView.appendChild(lastChild);

                    modelViewRelMap.set(nextView, nextEls);
                    modelViewRelMap.set(newView, [added[0], br]);
                    modelViewRelMap.set(added[0], newView);
                    modelViewRelMap.set(br, newView);
                }
                nextEl.style = style;
            }
            else if (prevView === nextView){
                const viewEls = modelViewRelMap.get(prevView);
                const id = viewEls.findIndex(val => val === nextEl);
                const [first, second] = splitString(prevView.textContent, pos - viewEls[0].getOffset());
                const lastParts = viewEls.splice(id, viewEls.length - id);

                if (prevEl.style === style){
                    viewEls.push(added[0]);
                    newView = createNewTextNode(prevView, null, style, true);
                    removeFromTextNode(prevView, 0, first.length);
                    appendToTextNode(newView , 0, first + added[0].text);

                    modelViewRelMap.set(prevView, lastParts)
                    modelViewRelMap.set(newView, viewEls);
                    viewEls.forEach(val => modelViewRelMap.set(val, newView));
                    lastParts.forEach(val => modelViewRelMap.set(val, prevView));
                }
                else {
                    let newNewView = createNewTextNode(prevView, added[0].text, style, true);
                    newView = createNewTextNode(newNewView, first, prevEl.style, true);
                    removeFromTextNode(prevView, 0, first.length);

                    modelViewRelMap.set(newView, viewEls)
                    modelViewRelMap.set(newNewView, [added[0]]);
                    modelViewRelMap.set(prevView, lastParts);
                    viewEls.forEach(val => modelViewRelMap.set(val, newView));
                    modelViewRelMap.set(added[0], newNewView);
                    lastParts.forEach(val => modelViewRelMap.set(val, prevView));
                }
            }
            else {
                if (prevEl)
                    newView = createNewTextNode(prevView, text, style, false);
                else if (nextEl)
                    newView = createNewTextNode(nextView, text, style, true);
                modelViewRelMap.set(added[0], newView);
                modelViewRelMap.set(newView, [added[0]]);
            }
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

        const br = document.createElement('br');
        br.setAttribute('class', 'newline');
        newTextNode.appendChild(br);

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
            newPar = addParagraph(modelViewRelMap.get(nextEl).parentNode, null, prevEl ? prevEl.style : nextEl.style, false);
            const nextView = modelViewRelMap.get(nextEl);
            const nextViewEls = modelViewRelMap.get(nextView);

            const oldBr = nextViewEls.pop();
            nextViewEls.push(added[0]);

            modelViewRelMap.set(added[0], nextView);
            modelViewRelMap.set(oldBr, newPar.childNodes[0]);

            modelViewRelMap.set(nextView, nextViewEls);
            modelViewRelMap.set(newPar.childNodes[0], [oldBr]);
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
            else if (prevView) {
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
            else {
                newPar = addParagraph(nextView.parentElement, null, null, true);
                modelViewRelMap.set(newPar.firstChild, [added[0]]);
                modelViewRelMap.set(added[0], newPar.firstChild);
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

function insertTab(pos){
    let {added, removed} = ropeInsertText('\t', null, pos);
    if (removed.length > 0) {
        const view = modelViewRelMap.get(removed[0]);
        const viewEls = modelViewRelMap.get(view);

        const newTextNode = createNewTextNode(view, null, null, true, false);

        const id = viewEls.findIndex(val => val === removed[0]);
        viewEls.splice(id, 1);
        const lastEls = viewEls.splice(id, viewEls.length - id);
        viewEls.push(added[0]);
        lastEls.unshift(added[2]);

        const [first, second] = splitString(view.textContent, pos - added[0].getOffset());
        appendToTextNode(newTextNode, 0, first);
        removeFromTextNode(view, 0, first.length);

        const pre = document.createElement('pre');
        pre.setAttribute('class', 'tab');
        pre.appendChild(document.createTextNode('\t'));
        view.after(pre);

        viewEls.forEach(val => modelViewRelMap.set(val, newTextNode));
        lastEls.forEach(val => modelViewRelMap.set(val, view));
        modelViewRelMap.delete(removed[0]);
        modelViewRelMap.set(newTextNode, viewEls);
        modelViewRelMap.set(view, lastEls);
        modelViewRelMap.set(pre, [added[1]]);
        modelViewRelMap.set(added[1], pre)
    }
    else {
        let prevEl = added[0].prevTextNode();
        let nextEl = added[0].nextTextNode();

        const prevView = modelViewRelMap.get(prevEl);
        const prevViewEls = modelViewRelMap.get(prevView);

        const nextView = modelViewRelMap.get(nextEl);

        if (prevView === nextView){
            const newTextNode = createNewTextNode(prevView, null, prevEl.style, true, false);

            const id = prevViewEls.findIndex(val => val === prevEl);
            const lastEls = prevViewEls.splice(id + 1, prevViewEls.length - id - 1);

            const [first, second] = splitString(prevView.textContent, pos - (prevViewEls.length > 0 ? prevViewEls[0].getOffset() : 0));
            appendToTextNode(newTextNode, 0, first);
            removeFromTextNode(prevView, 0, first.length);

            const pre = document.createElement('pre');
            pre.setAttribute('class', 'tab');
            pre.appendChild(document.createTextNode('\t'));
            prevView.before(pre);

            prevViewEls.forEach(val => modelViewRelMap.set(val, newTextNode));
            modelViewRelMap.set(added[0], pre);
            modelViewRelMap.set(pre, [added[0]]);
            modelViewRelMap.set(prevView, lastEls);
            modelViewRelMap.set(newTextNode, prevViewEls);
        }
        else {
            const pre = document.createElement('pre');
            pre.setAttribute('class', 'tab');
            pre.appendChild(document.createTextNode('\t'));
            if (nextView != null && prevEl != null && prevEl.text === '\n')
                nextView.parentElement.firstChild.before(pre);
            else if (prevView)
                prevView.after(pre);
            else
                nextView.before(pre);

            modelViewRelMap.set(pre, [added[0]]);
            modelViewRelMap.set(added[0], pre);
        }
    }
}

function deleteText(pos, length){
    let changed = ropeDeleteText(pos, length); // {el, before}

    let deleted = [];
    let tmp = 0;
    while (tmp < changed.length){
        let val = changed[tmp];
        if (tmp === 0)
            deleted.push(val.before.slice(val.el.text.length), val.el.style);
        else if (tmp === changed.length - 1){
            deleted.push(val.before.slice(0, val.el.text.length), val.el.style);
        }
        else {
            deleted.push(val.before, val.el.style);
        }
        ++tmp;
    }

    let i = 0;
    while (i < changed.length){
        let val = changed[i];

        let view = modelViewRelMap.get(val.el);
        let viewEls = modelViewRelMap.get(view);
        let id = viewEls.findIndex(vall => vall === val.el);

        if (val.before === '\n') {
            viewEls.splice(id,1);
            view.childNodes[view.childNodes.length - 1].remove();
            const parentDiv = view.parentElement;
            const nextDiv = view.parentElement.nextSibling;
            nextDiv.childNodes.forEach(val => {
                val.remove();
                parentDiv.appendChild(val);
            })
            nextDiv.remove();
            modelViewRelMap.delete(val.el);
        }
        else if (val.before === '\v') {
            view.childNodes[view.childNodes.length - 1].remove();
            viewEls.splice(id, 1);
            modelViewRelMap.delete(val.el);
        }
        else {
            let offset = viewEls[id - 1] ? viewEls[id - 1].getOffset() - viewEls[0].getOffset() + viewEls[id - 1].getLength() : 0;
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
        ++i;
    }


    return deleted;
}

function changeFormatting(pos, length, style){

}

function applyFormattingToElement(el, styleCode, value){
    switch (parseInt(styleCode)){
        case STYLE_CODES.BOLD : changeElementClass(el, 'bold', parseInt(value)); break;
        case STYLE_CODES.ITALIC : changeElementClass(el, 'italic', parseInt(value)); break;
        case STYLE_CODES.UNDERLINE : changeElementDecoration(el, 'underline', parseInt(value)); break;
        case STYLE_CODES.STRIKETHROUGH : changeElementDecoration(el, 'line-through', parseInt(value)); break;
        case STYLE_CODES.FONT : changeFont(el, parseInt(value)); break;
        case STYLE_CODES.FONT_COLOUR : break;
        case STYLE_CODES.FONT_SIZE : changeFontSize(el, parseInt(value));
    }
}

function clearFormatting(el){
    el.removeAttribute('style');
    el.removeAttribute('class');
}

function changeElementClass(el, targetClass, enabled){
    el.classList.remove(targetClass);
    if (enabled === 1) el.classList.add(targetClass);
}

function changeElementDecoration(el, decoration, enabled) {
    el.style.textDecoration = el.style.textDecoration ? el.style.textDecoration.replace(decoration, '') : '';
    if (enabled === 1) el.style.textDecoration = el.style.textDecoration + ' ' + decoration;
}

function changeFont(el, fontCode){
    el.style.fontFamily = fontCodes.get(fontCode);
}

function changeFontSize(el, size){
    el.style.fontSize = size + 'pt';
}

//util
function getViewCaretIndex(){
    const selection = window.getSelection();
    if (selection.rangeCount !== 0){
        const range = window.getSelection().getRangeAt(0);
        const preCaretRange = range.cloneRange();
        let start = preCaretRange.startContainer;

        return getOffsetForElement(start, range.startOffset);
    }
    else
        return -1;
}

function getViewCaretStartEnd(){
    const selection = window.getSelection();
    if (selection.rangeCount !== 0){
        const range = window.getSelection().getRangeAt(0);
        const preCaretRange = range.cloneRange();
        let start = preCaretRange.startContainer;
        let end = preCaretRange.endContainer;

        if (start.tagName === 'BR')
            start = start.parentElement;
        else if (start.tagName === 'DIV')
            start = start.firstChild;

        if (end.tagName === 'BR')
            end = end.parentElement;
        else if (end.tagName === 'DIV')
            end = end.lastChild;

        return [
            getOffsetForElement(start, range.startOffset),
            getOffsetForElement(end, range.endOffset)
        ];
    }
    else
        return [-1, - 1];
}

function getOffsetForElement(el, rangeOffset){
    let isText = el.nodeName === '#text';
    let startNode = isText ? el.parentNode : el;
    let modelNode = modelViewRelMap.get(startNode);
    let before = modelNode[0].getOffset();
    if (isText)
        before += rangeOffset;
    else
        before+= startNode.textContent.length;

    return before;
}