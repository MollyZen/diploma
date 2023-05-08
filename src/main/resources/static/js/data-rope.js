var ropeRoot =  new TreeNode(null, null, null,null, null);

const StyleCodes = {
    'BOLD' : 0,
    'CURSIVE' : 1,
    'UNDERLINE' : 2,
    'STRIKETHROUGH' : 3,
    'FONT' : 4,
    'FONT_COLOUR' : 5,
    'FONT_SIZE' : 6,
    'LIST_ORDERED' : 7,
    'LIST_UNORDERED' : 8,
    'HEADER' : 9,
    'PARAGRAPH' : 10
}
function dataRopeTest() {

    ropeInsertText('govno ', null, 0);
    ropeInsertText('zhopa ', null, 0);
    ropeInsertText('suka ', null, 0);

    ropeInsertText('blya', null, 17);

    ropeInsertText('after suka ', null, 5);
    ropeInsertText('aaa ', null, 16);

    ropeInsertText('sss', null, 1);
}

function displayTree() {
    if (document.getElementById) {
        w = screen.availWidth;
        h = screen.availHeight;
    }
    let popW = 800, popH = 700;
    let leftPos = (w-popW)/2;
    let topPos = (h-popH)/2;
    let msgWindow = window.open('/static/treant-display.html',
        'popup',
        'width=' + popW + ',height=' + popH + ',top=' + topPos + ',left=' + leftPos + ',scrollbars=yes');
}

function TreeNode(parent, left, right, text, style) {
    this.parent = parent;
    this.children = [left, right];
    this.text = text;
    this.length = text ? text.length : null;
    this.newLineCount = text ? (text.match(/\n/g)||[]).length : 0;
    this.style = [];
    this.style.concat(Array.isArray(style) ? style : style ? [style] : []);

    //functions
    this.getText = () => {
        return text;
    }
    this.getLength = () => {
        return this.text? this.text.length : this.length;
    }
    this.getLeft = () => {
        return this.children[0];
    }
    this.getRight = () => {
        return this.children[1];
    }
    this.setText = (text) => {
        this.newLineCount = text ? (text.match(/\n/g)||[]).length : 0;
        this.text = text;
        this.updateLength();
    }
    this.setLeft = (left) => {
        this.children[0] = left;
        left.parent = this;
        this.updateLength();
    }
    this.setRight = (right) => {
        this.children[1] = right;
        right.parent = this;
        this.updateLength();
    }
    this.updateLength = () => {
        if (this.text == null)
            this.length = (this.getLeft() ? this.getLeft().length : 0) + (this.getRight() ? this.getRight().length : 0);
        if (this.parent)
            this.parent.updateLength();
    }
    this.deleteLeft = () => {
        if (this.getLeft()) {
            this.getLeft().deleteLeft();
            this.getLeft().deleteRight();
            this.children[0] = null;
        }
        this.updateLength();
    }
    this.deleteRight = () => {
        if (this.getRight()) {
            this.getRight().deleteLeft();
            this.getRight().deleteRight();
            this.children[1] = null;
        }
        this.updateLength();
    }
    this.isLeft = () => {
        return this.parent.getLeft() === this;
    }
    this.nextTextNode = () => {
        if (this.text) return nextTextNode(this);
        else return leftmostChild(this);
    }
    this.prevTextNode = () => {
        if (this.text) return prevTextNode(this);
        else return leftmostChild(this);
    }
    this.getOffset = () => {
        return getOffset(this);
    }
}

function leftmostChild(node){
    let el = node;
    while (el.text == null){
        if (el.getLeft())
            el = el.getLeft();
        else
            el = el.getRight();
    }
    return el;
}

function ropeInsertText(text, style, pos) {
    let newNode = new TreeNode(null, null, null, text, style);

    let added = [];
    let removed = [];
    if (pos === 0 || pos === ropeRoot.length){
        if (ropeRoot.getLeft() || ropeRoot.getRight() || ropeRoot.getText()) {
            if (pos === 0){
                if (ropeRoot.getLeft() == null)
                    ropeRoot.setLeft(newNode);
                else if (ropeRoot.getRight() == null){
                    ropeRoot.setRight(ropeRoot.getLeft());
                    ropeRoot.setLeft(newNode);
                }
                else
                    ropeRoot = concat(newNode, ropeRoot);
            }
            else {
                if (pos === 0) {
                    if (ropeRoot.getRight() == null)
                        ropeRoot.setRight(newNode);
                    else if (ropeRoot.getLeft() == null) {
                        ropeRoot.setLeft(ropeRoot.getRight());
                        ropeRoot.setRight(newNode);
                    } else
                        ropeRoot = concat(ropeRoot, newNode);
                }
            }
            //ropeRoot = pos === 0 ? concat(newNode, ropeRoot) : concat(ropeRoot, newNode);
        }
        else
            ropeRoot.setRight(newNode)

        return {added : [newNode], removed};
    }

    let toChange = getAffectedNode(ropeRoot, pos);
    let affectedNode = toChange[0];
    let remainingPos = pos - toChange[1];

    let isLeft = affectedNode.parent.getLeft() === affectedNode;

    if (remainingPos === 0) {
        if (isLeft) {
            if (affectedNode.parent.getRight() == null) {
                affectedNode.parent.setRight(affectedNode);
                affectedNode.parent.setLeft(newNode);
            } else {
                affectedNode.parent.setLeft(concat(newNode, affectedNode));
            }
        } else {
            if (affectedNode.parent.getLeft() == null) {
                affectedNode.parent.setLeft(newNode);
            } else {
                affectedNode.parent.setRight(concat(newNode, affectedNode));
            }
        }
        added.push(newNode);
    } else if (remainingPos === affectedNode.length) {
        if (isLeft) {
            if (affectedNode.parent.getRight() == null) {
                affectedNode.parent.setRight(newNode);
            } else {
                affectedNode.parent.setLeft(concat(affectedNode, newNode));
            }
        } else {
            if (affectedNode.parent.getLeft() == null) {
                affectedNode.parent.setLeft(affectedNode);
                affectedNode.parent.setRight(newNode);
            } else {
                affectedNode.parent.setRight(concat(affectedNode, newNode));
            }
        }
        added.push(newNode);
    } else {
        let [first, second] = splitString(affectedNode.text, remainingPos);
        let node1 = new TreeNode(null, null, null, first, affectedNode.style);
        added.push(node1);
        node1 = concat(node1, newNode);
        let node2 = new TreeNode(null, null, null, second, affectedNode.style);
        node1 = concat(node1, node2);
        if (isLeft)
            affectedNode.parent.setLeft(node1);
        else
            affectedNode.parent.setRight(node1);
        added.push(newNode);
        added.push(node2);
        removed.push(affectedNode);
    }

    return {added, removed};
}

function ropeDeleteText(pos, length) {
    let start = getAffectedNode(ropeRoot, pos)
    let affected = start[0];
    let remainingPos = pos - affected[1];

    let remainingLength = length;

    let lastNode = affected;
    let nodeLength = lastNode.getLength();
    let parent = lastNode.parent;
    let isLeft = lastNode.isLeft();

    if (length === ropeRoot.getLength()){
        ropeRoot.deleteLeft();
        ropeRoot.deleteRight();
        return;
    }

    if (remainingPos > 0) {
        let toDelete = clamp(remainingLength, 0, nodeLength);
        remainingLength -= toDelete;
        deletePartFromTextNode(lastNode, remainingPos, toDelete);
        lastNode = nextTextNode(lastNode);
    }
    else {
        if (nodeLength > remainingLength) {
            deletePartFromTextNode(lastNode, 0, remainingLength);
            remainingLength = 0;
        }
        else {
            remainingLength -= nodeLength;
            lastNode = nextTextNode(lastNode);
            isLeft ? parent.deleteLeft() : parent.deleteRight();
            while (parent.getLeft() == null && parent.getRight() == null){
                parent.isLeft() ? parent.parent.deleteLeft() : parent.parent.deleteRight();
                parent = parent.parent;
            }
        }
    }

    while (remainingLength > 0){
        nodeLength = lastNode.getLength();
        parent = lastNode.parent;
        isLeft = lastNode.isLeft();
        if (nodeLength > remainingLength) {
            deletePartFromTextNode(lastNode, 0, remainingLength);
            remainingLength = 0;
        }
        else {
            remainingLength -= nodeLength;
            lastNode = nextTextNode(lastNode);
            isLeft ? parent.deleteLeft() : parent.deleteRight();
            while (parent.getLeft() == null && parent.getRight() == null){
                parent.isLeft() ? parent.parent.deleteLeft() : parent.parent.deleteRight();
                parent = parent.parent;
            }
        }
    }

}

function deletePartFromTextNode(node, pos, length){
    let split = splitString(node.text, pos);
    let remaining = splitString(split[1], length);
    node.setText(split[0] + remaining[1]);
}

function concat(left, right) {
    let node = new TreeNode();
    node.setLeft(left);
    node.setRight(right);

    return node;
}

function getAffectedNode(start, pos) {
    let posChecked = 0;
    let node = start;
    while (true) {
        if (node.text)
            break
        else if (pos === 0) {
            while (node.text == null)
                node = node.getLeft() || node.getRight();
        }
        else if (pos === ropeRoot.length){
            while (node.text == null)
                node = node.getRight() || node.getLeft();
            posChecked = ropeRoot.length;
        }
        else if (node.getLeft() && (posChecked + node.getLeft().getLength()) >= pos) {
            node = node.getLeft();
        }
        else if (node.getRight() && (posChecked + node.getRight().getLength() + (node.getLeft() ? node.getLeft().getLength() : 0)) >= pos) {
            posChecked += node.getLeft().getLength();
            node = node.getRight();
        }
        else
            break;
    }
    return [node, posChecked];
}

function nextTextNode(start){
    let node = start;
    let parent = start.parent;

    while (parent){
        if (parent.getRight() === node || parent.getRight() == null){
            node = parent;
            parent = node.parent;
        }
        else
            break;
    }

    if (parent) {
        node = parent.getRight();
        while (node && node.text == null)
            if (node.getLeft())
                node = node.getLeft();
            else
                node = node.getRight();
    }
    else
        node = null

    return node;
}

function prevTextNode(start){
    let node = start;
    let parent = start.parent;

    while (parent){
        if (node.isLeft() || parent.getLeft() == null){
            node = parent;
            parent = node.parent;
        }
        else
            break;
    }

    if (parent) {
        node = parent.getLeft();
        while (node && node.text == null)
            if (node.getRight())
                node = node.getRight();
            else
                node = node.getLeft();
    }
    else
        node = null;

    return node;
}

function getFullString(start){
    let c = start;
    let toCheck = [];
    while (c != null) {
        toCheck.push(c);
        c = c.getLeft();
    }

    let res = '';
    while (toCheck.length > 0) {
        let node = toCheck.pop();
        if (node.getText()) {
            res = res.concat(node.getText());
        } else {
            let right = node.getRight();
            if (right != null) {
                toCheck.push(right);
                let cleft = right.getLeft();
                while (cleft != null){
                    toCheck.push(cleft);
                    cleft = cleft.getLeft();
                }
            }
        }
    }
    return res;
}

function splitString(str, index) {
    return [str.slice(0, index), str.slice(index)];
}

function getOffset(node){
    let curNode = node;
    while(curNode.parent && (curNode.parent.getLeft() == null || !curNode.isLeft()))
        curNode = curNode.parent;

    let res = 0;
    if (curNode !== node && curNode.getLeft() !== node)
        res = curNode.getLeft().getLength();

    return res;
}