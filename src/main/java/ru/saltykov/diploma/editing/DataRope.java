package ru.saltykov.diploma.editing;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.util.Pair;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class DataRope {
    @Getter
    private TreeNode ropeRoot = new TreeNode();
    @Getter
    @Setter
    public static class TreeNode {
        private TreeNode parent;
        private TreeNode left;
        private TreeNode right;
        private String text;
        private String style;
        private Integer length;

        TreeNode(TreeNode parent, TreeNode left, TreeNode right, String text, String style){
            this.parent = parent;
            this.left = left;
            this.right = right;
            this.text = text;
            this.style = style;
            this.length = text != null ? text.length() : 0;
        }
        TreeNode(){
            this.length = 0;
        }
        public void updateLength(){
            if (this.text == null)
                this.length = (this.getLeft() != null ? this.getLeft().getLength() : 0) + (this.getRight() != null ? this.getRight().getLength() : 0);
            else
                this.length = this.text.length();
            if (this.parent != null)
                this.parent.updateLength();
        }
        public void setLeft(TreeNode left){
            this.left = left;
            if (left != null) this.left.setParent(this);
            this.updateLength();
        }
        public void setRight(TreeNode right){
            this.right = right;
            if (right != null) this.right.setParent(this);
            this.updateLength();
        }
        public void setTest(String text){
            this.text = text;
            this.updateLength();
        }
        public void deleteLeft(){
            if (this.getLeft() != null) {
                this.getLeft().deleteLeft();
                this.getLeft().deleteRight();
                this.getLeft().text = null;
                this.setLeft(null);
            }
            this.updateLength();
        }
        public void deleteRight(){
            if (this.getRight() != null) {
                this.getRight().deleteLeft();
                this.getRight().deleteRight();
                this.getRight().text = null;
                this.setRight(null);
            }
            this.updateLength();
        }
        public boolean isLeft(){
            if (this.getParent() == null)
                return false;
            else
                return Objects.equals(this.getParent().getLeft(), this);
        }
        public TreeNode nextTextNode(){
            if (this.text != null) return DataRope.nextTextNode(this);
            else return DataRope.leftmostChild(this);
        }
        public TreeNode prevTextNode(){
            if (this.text != null) return DataRope.prevTextNode(this);
            else return DataRope.leftmostChild(this);
        }
    }

    public static TreeNode leftmostChild(TreeNode node){
        TreeNode el = node;
        while (el != null && el.getText() == null) {
            if (el.getLeft() != null)
                el = el.getLeft();
            else
                el = el.getRight();
        }
        return el;
    }

    public static TreeNode rightmostChild(TreeNode node){
        TreeNode el = node;
        while (el.getText() == null) {
            if (el.getRight() != null)
                el = el.getRight();
            else
                el = el.getLeft();
        }
        return el;
    }

    public Pair<List<TreeNode>, List<TreeNode>> ropeInsertText(String text, String style, Integer pos){
        TreeNode newNode = new TreeNode(null, null, null, text, style);
        List<TreeNode> added = new ArrayList<>();
        List<TreeNode> removed = new ArrayList<>();
        if (pos == 0 || pos.equals(ropeRoot.getLength())){
            if (ropeRoot.getLeft() != null || ropeRoot.getRight() != null || ropeRoot.getText() != null){
                if (pos == 0){
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
                    if (ropeRoot.getRight() == null)
                        ropeRoot.setRight(newNode);
                    else if (ropeRoot.getLeft() == null) {
                        ropeRoot.setLeft(ropeRoot.getRight());
                        ropeRoot.setRight(newNode);
                    } else
                        ropeRoot = concat(ropeRoot, newNode);
                }
            }
            else
                ropeRoot.setRight(newNode);
            added.add(newNode);
            return Pair.of(added, removed);
        }

        Pair<TreeNode,Integer> toChange = getAffectedNode(ropeRoot, pos);
        TreeNode affectedNode = toChange.getFirst();
        int remainingPos = pos - toChange.getSecond();

        boolean isLeft = affectedNode.isLeft();

        if (remainingPos == 0) {
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
            added.add(newNode);
        } else if (remainingPos == affectedNode.length) {
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
            added.add(newNode);
        } else {
            Pair<String, String> split = splitString(affectedNode.text, remainingPos);
            String first = split.getFirst();
            String second = split.getSecond();
            TreeNode node1 = new TreeNode(null, null, null, first, affectedNode.style);
            added.add(node1);
            node1 = concat(node1, newNode);
            TreeNode node2 = new TreeNode(null, null, null, second, affectedNode.style);
            node1 = concat(node1, node2);
            if (isLeft)
                affectedNode.parent.setLeft(node1);
            else
                affectedNode.parent.setRight(node1);
            added.add(newNode);
            added.add(node2);
            removed.add(affectedNode);
        }

        return Pair.of(added, removed);
    }

    public List<Pair<TreeNode, String>> ropeDeleteText(int pos, int length){
        Pair<TreeNode, Integer> start = getAffectedNode(ropeRoot, pos + 1);
        TreeNode affected = start.getFirst();
        int remainingPos = pos - start.getSecond();
        if (remainingPos < 0)
            remainingPos = Math.abs(pos - start.getSecond());

        int remainingLength = length;

        TreeNode lastNode = affected;
        int nodeLength = lastNode.getLength();
        TreeNode parent = lastNode.getParent();
        boolean isLeft = lastNode.isLeft();

        List<Pair<TreeNode, String>> changed = new ArrayList<>();
        if (length == ropeRoot.getLength()){
            TreeNode el = leftmostChild(ropeRoot);
            while (el != null){
                changed.add(Pair.of(el, el.getText()));
                el = el.nextTextNode();
            }
            ropeRoot.deleteLeft();
            ropeRoot.deleteRight();
            return changed;
        }

        if (remainingPos > 0){
            int toDelete =  Math.max(0, Math.min(nodeLength - remainingPos, remainingLength));
            remainingLength -= toDelete;
            changed.add(Pair.of(lastNode, lastNode.getText()));
            deletePartFromTextNode(lastNode, remainingPos, toDelete);
            lastNode = lastNode.nextTextNode();
        }
        else {
            changed.add(Pair.of(lastNode, lastNode.getText()));
            if (nodeLength > remainingLength) {
                deletePartFromTextNode(lastNode, 0, remainingLength);
                remainingLength = 0;
            }
            else {
                lastNode.text = null;
                remainingLength -= nodeLength;
                lastNode = lastNode.nextTextNode();
                if (isLeft) parent.deleteLeft();
                else parent.deleteRight();

                while (parent.getLeft() == null && parent.getRight() == null){
                    if (parent.isLeft())
                        parent.parent.deleteLeft();
                    else parent.parent.deleteRight();
                    parent = parent.getParent();
                }
            }
        }

        while (remainingLength > 0){
            changed.add(Pair.of(lastNode, lastNode.getText()));
            nodeLength = lastNode.getLength();
            parent = lastNode.parent;
            isLeft = lastNode.isLeft();
            if (nodeLength > remainingLength) {
                deletePartFromTextNode(lastNode, 0, remainingLength);
                remainingLength = 0;
            }
            else {
                remainingLength -= nodeLength;
                lastNode.text = null;
                lastNode = lastNode.nextTextNode();
                if (isLeft)
                    parent.deleteLeft();
                else
                    parent.deleteRight();
                while (parent.getLeft() == null && parent.getRight() == null){
                    if (parent.isLeft())
                        parent.parent.deleteLeft();
                    else
                        parent.parent.deleteRight();
                    parent = parent.parent;
                }
            }
        }

        return changed;
    }

    public void deletePartFromTextNode(TreeNode node, int pos, int length){
        Pair<String, String> split = splitString(node.getText(), pos);
        Pair<String, String> remaining = splitString(split.getSecond(), length);
        node.setText(split.getFirst() + remaining.getSecond());
    }

    public TreeNode concat(TreeNode left, TreeNode right) {
        TreeNode node = new TreeNode();
        node.setLeft(left);
        node.setRight(right);

        return node;
    }

    public Pair<TreeNode, Integer> getAffectedNode(TreeNode start, int pos) {
        int posChecked = 0;
        TreeNode node = start;
        while (true) {
            if (node.getText() != null)
                break;
            else if (pos == 0) {
                while (node.getText() == null)
                    node = node.getLeft() != null ? node.getLeft() : node.getRight();
            }
            else if (pos == ropeRoot.getLength()){
                while (node.getText() == null)
                    node = node.getRight() != null ? node.getRight() : node.getLeft();
                posChecked = ropeRoot.getLength();
            }
            else if (node.getLeft() != null && (posChecked + node.getLeft().getLength()) >= pos) {
                node = node.getLeft();
            }
            else if (node.getRight() != null && (posChecked + node.getRight().getLength() + (node.getLeft() != null ? node.getLeft().getLength() : 0)) >= pos) {
                posChecked += node.getLeft() != null ? node.getLeft().getLength() : 0;
                node = node.getRight();
            }
            else
                break;
        }
        return Pair.of(node, posChecked);
    }

    public static TreeNode nextTextNode(TreeNode start){
        TreeNode node = start;
        TreeNode parent = start.getParent();

        while (parent != null){
            if (parent.getRight() == null || parent.getRight().equals(node)){
                node = parent;
                parent = node.getParent();
            }
            else
                break;
        }

        if (parent != null) {
            node = parent.getRight();
            while (node != null && node.getText() == null)
                if (node.getLeft() != null)
                    node = node.getLeft();
                else
                    node = node.getRight();
        }
        else
            node = null;

        return node;
    }

    public static TreeNode prevTextNode(TreeNode start){
        TreeNode node = start;
        TreeNode parent = start.getParent();

        while (parent != null){
            if (node.isLeft() || parent.getLeft() == null){
                node = parent;
                parent = node.getParent();
            }
            else
                break;
        }

        if (parent != null) {
            node = parent.getLeft();
            while (node != null && node.getText() == null)
                if (node.getRight() != null)
                    node = node.getRight();
                else
                    node = node.getLeft();
        }
        else
            node = null;

        return node;
    }

    public Pair<String, String> splitString(String str, int index) {
        return Pair.of(str.substring(0, index), str.substring(index));
    }
}
