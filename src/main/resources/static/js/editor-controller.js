
function testChangesDisplay() {

    ropeRoot.deleteLeft();
    ropeRoot.deleteRight();

    controllerInsert('govno ', null, 0);
    controllerInsert('zhopa ', null, 0);
    controllerInsert('suka ', null, 0);

    controllerInsert('blya', null, 17);

    controllerInsert('after suka ', null, 5);
    controllerInsert('aaa ', null, 16);

    controllerInsert('sss', null, 1);

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