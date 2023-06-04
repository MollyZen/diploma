let bold = false;
let italic = false;
let underline = false;
let strikethrough = false;
let fontSize = 11;
let font = 'Arial';

const fontCodes = new Map();
const enabledStyles = new Map();

function toolbarSetup() {
    const userAction = async () => {
        const response = await fetch('/rest/getUsername');
        const res = await response.text();
        if (res == null || res === ''){
            const link = document.createElement('a');
            link.setAttribute('href', '/login?redirect=' + encodeURIComponent(window.location.href))

            const button = document.createElement('button');
            button.classList.add('editor-button');
            button.appendChild(document.createTextNode('Войти'));
            button.addEventListener('click', (ev) => {
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
            })
            link.appendChild(button);
            document.getElementById('images').before(link);
        }
    };
    userAction.apply();
    const boldButton = document.getElementById('bold-button');
    boldButton.addEventListener('click', (ev) => {
        if (bold){
            bold = false;
            enabledStyles.delete(STYLE_CODES.BOLD);
            boldButton.classList.remove('active');
        }
        else{
            bold = true;
            enabledStyles.set(STYLE_CODES.BOLD, 1);
            boldButton.classList.add('active');
        }
    })
    const italicButton = document.getElementById('italic-button');
    italicButton.addEventListener('click', (ev) => {
        if (italic){
            italic = false;
            enabledStyles.delete(STYLE_CODES.ITALIC);

            italicButton.classList.remove('active');
        }
        else{
            italic = true;
            enabledStyles.set(STYLE_CODES.ITALIC, 1);
            italicButton.classList.add('active');
        }
    })
    const underlineButton = document.getElementById('underline-button');
    underlineButton.addEventListener('click', (ev) => {
        if (underline){
            underline = false;
            enabledStyles.delete(STYLE_CODES.UNDERLINE);
            underlineButton.classList.remove('active');
        }
        else{
            underline = true;
            enabledStyles.set(STYLE_CODES.UNDERLINE, 1);
            underlineButton.classList.add('active');
        }
    })
    const strikeButton = document.getElementById('strikethrough-button');
    strikeButton.addEventListener('click', (ev) => {
        if (strikethrough){
            strikethrough = false;
            enabledStyles.delete(STYLE_CODES.STRIKETHROUGH);
            strikeButton.classList.remove('active');
        }
        else{
            strikethrough = true;
            enabledStyles.set(STYLE_CODES.STRIKETHROUGH, 1);
            strikeButton.classList.add('active');
        }
    })

    window.addEventListener('keydown', function (ev){
        if (ev.ctrlKey){

            if (ev.altKey){
                if (ev.key.toLowerCase() === 'u'){
                    if (strikethrough){
                        strikethrough = false;
                        enabledStyles.delete(STYLE_CODES.STRIKETHROUGH);
                        strikeButton.classList.remove('active');
                    }
                    else{
                        strikethrough = true;
                        enabledStyles.set(STYLE_CODES.STRIKETHROUGH, 1);
                        strikeButton.classList.add('active');
                    }
                }
            }
            else {
                if (ev.key.toLowerCase() === 'b') {
                    if (bold) {
                        bold = false;
                        enabledStyles.delete(STYLE_CODES.BOLD);
                        boldButton.classList.remove('active');
                    } else {
                        bold = true;
                        enabledStyles.set(STYLE_CODES.BOLD, 1);
                        boldButton.classList.add('active');
                    }
                } else if (ev.key.toLowerCase() === 'i') {
                    if (italic) {
                        italic = false;
                        enabledStyles.delete(STYLE_CODES.ITALIC);

                        italicButton.classList.remove('active');
                    } else {
                        italic = true;
                        enabledStyles.set(STYLE_CODES.ITALIC, 1);
                        italicButton.classList.add('active');
                    }
                } else if (ev.key.toLowerCase() === 'u') {
                    ev.preventDefault();
                    if (underline) {
                        underline = false;
                        enabledStyles.delete(STYLE_CODES.UNDERLINE);
                        underlineButton.classList.remove('active');
                    } else {
                        underline = true;
                        enabledStyles.set(STYLE_CODES.UNDERLINE, 1);
                        underlineButton.classList.add('active');
                    }
                }
            }
        }
    })

    const userAction1 = async () => {
        const response = await fetch('/rest/fontCodes');
        const obj = await response.json()
        const fontEl = document.getElementById('font');
        const nextSibling = fontEl.nextElementSibling;
        for (let key in obj){
            let value = obj[key];
            const liEl = document.createElement('li');
            const div = document.createElement('div');
            div.setAttribute('class', 'option');
            div.style.fontFamily = value;
            div.appendChild(document.createTextNode(value));
            liEl.appendChild(div);

            liEl.addEventListener('click', () => {
                let parent = liEl.parentElement;
                while (!parent.classList.contains('select_wrap')) {
                    parent = parent.parentElement;
                }
                const wrap = parent;
                const nowrap = document.createElement('div');
                nowrap.classList.add('nowrap');
                const copy = liEl.firstChild.cloneNode(true);
                nowrap.textContent = copy.textContent;
                copy.textContent = null;
                copy.appendChild(nowrap);

                wrap.querySelector('ul .default_option').firstChild.remove();
                wrap.querySelector('ul .default_option')
                    .firstChild.before(copy);
                wrap.classList.remove('active');
            })

            if (key === '0' || key === 0) {
                const nowrap = document.createElement('div');
                nowrap.classList.add('nowrap');
                const copy = liEl.firstChild.cloneNode(true);
                nowrap.textContent = copy.textContent;
                copy.textContent = null;
                copy.appendChild(nowrap);
                fontEl.firstChild.before(copy);
                font = parseInt(key);
                enabledStyles.set(STYLE_CODES.FONT, font);
            }
            fontCodes.set(parseInt(key), value);
            fontCodes.set(value, parseInt(key));
            nextSibling.appendChild(liEl);
        }
    }
    userAction1.apply();

    $(".default_option").click(function () {
        $(this).parent().toggleClass("active");
    })

    const regex = /^[0-9]+$/;

    $("#font").on('DOMSubtreeModified', function (){
        font = fontCodes.get($(this).children("div .option").text().trim());
        enabledStyles.set(STYLE_CODES.FONT, font);
    });
    document.querySelector(".select_wrap")
    document.querySelectorAll(".select_wrap .select_ul li").forEach((val) => val.addEventListener('click', (ev) => {
        let parent = ev.target.parentElement;
        while (!parent.classList.contains('select_wrap')) {
            parent = parent.parentElement;
        }
        const wrap = parent;
        const tmp = wrap.querySelector('ul .default_option');
        if (tmp.firstChild.nodeName === '#text'){
            tmp.firstChild.remove();
        }
        tmp.firstChild.remove();
        if (ev.target.tagName === 'LI')
            tmp.firstChild.before(ev.target.firstChild.cloneNode(true));
        else
            tmp.firstChild.before(ev.target.cloneNode(true));
        wrap.classList.remove('active');
    }))
    $("#zoom").on('DOMSubtreeModified', function () {
        const val = Number($(this).children("div .option").text().replace('%', '').trim()) / 100.;
        const pane = $("#pane");

        const oldPaneHeight = pane.outerHeight();
        const oldPaneWidth = pane.outerWidth();

        pane.css('scale', val.toString());

        const newPaneHeight = (pane.outerHeight()) * val;
        const newPaneWidth = (pane.outerWidth()) * val;

        const deltaHeight = newPaneHeight - oldPaneHeight;
        const deltaWidth = newPaneWidth - oldPaneWidth;

        const tmp = $("#tmp");
        const oldTmpHeight = tmp.height();
        const oldTmpWidth = tmp.width();
        //tmp.height(oldTmpHeight + deltaHeight);
        //tmp.width(oldTmpWidth + deltaWidth);
        tmp.width(newPaneWidth);
        tmp.height(newPaneHeight);
        //TODO: переписать без jquery и убрать лишнее

        var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        var bannerHeight = banner.offsetHeight// + bottom_banner.offsetHeight;
        paneHolder.height(vh - bannerHeight);
        paneHolder.width(vw);

        if (paneHolder.width() - $('#tmp').width() <= 60){
            $('#tmp').css('display', 'inline-block');
            $('#tmp').css('margin', '30px 30px');
        } else {
            $('#tmp').css('display', '');
            $('#tmp').css('margin', '30px auto');
        }
    });

    $("#font-size-input").val(fontSize);
    enabledStyles.set(STYLE_CODES.FONT_SIZE, fontSize);

    //handling button entry for font size
    $("#font-size-minus").click(function () {
        var val = clamp($("#font-size-input").val() - 1, 1, 400)
        $("#font-size-input").val(val);
        fontSize = val;
        enabledStyles.set(STYLE_CODES.FONT_SIZE, fontSize);
    })

    $("#font-size-plus").click(function () {
        var val = clamp(Number($("#font-size-input").val()) + 1, 1, 400)
        $("#font-size-input").val(val);
        fontSize = val;
        enabledStyles.set(STYLE_CODES.FONT_SIZE, fontSize);
    })

    $("#font-size-input").keydown(function (event) {
        if (event.key === "Backspace" || event.key === "Delete")
            return
        if (event.key === "Enter" || event.key === "Escape") {
            $("#font-size-input").blur();
            return;
        }
        if (event.key.match(regex) == null)
            event.preventDefault();
    });
    //handling manual entry for font size
    $("#font-size-input").blur(function () {
        var val = $("#font-size-input").val();
        if (val === "") {
            $("#font-size-input").val(fontSize);
            enabledStyles.set(STYLE_CODES.FONT_SIZE, fontSize);
        }
        else
            $("#font-size-input").val(parseInt(val, 10));
        val = clamp(Number(val), 1, 400);
        $("#font-size-input").val(val);
        fontSize = val;
        enabledStyles.set(STYLE_CODES.FONT_SIZE, fontSize);
    });

    const banner = document.getElementById("banner");
    const bottom_banner = document.getElementById("bottom_banner");
    const paneHolder = $("#pane-holder");
    addEventListener("resize", (event) =>
    {
        var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        var bannerHeight = banner.offsetHeight //+ bottom_banner.offsetHeight;
        paneHolder.height(vh - bannerHeight);
        paneHolder.width(vw);

        if (paneHolder.width() - $('#tmp').width() <= 60){
            $('#tmp').css('display', 'inline-block');
            $('#tmp').css('margin', '30px 30px');
        } else {
            $('#tmp').css('display', '');
            $('#tmp').css('margin', '30px auto');
        }
    });
    var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    var bannerHeight = banner.offsetHeight //+ bottom_banner.offsetHeight;
    paneHolder.height(vh - bannerHeight);
    paneHolder.width(vw);

    setPane(document.getElementById("pane"));
    const hideBannerButton = document.getElementById("hide-banner");
    hideBannerButton.addEventListener('click', (ev) => {
        if (hideBannerButton.classList.contains('bi-chevron-up')) {
            document.getElementById("top_banner").style.display = "none";
            hideBannerButton.classList.remove('bi-chevron-up');
            hideBannerButton.classList.add('bi-chevron-down');
            window.dispatchEvent(new Event('resize'));
        }
        else {
            document.getElementById("top_banner").style.display  = "";
            hideBannerButton.classList.remove('bi-chevron-down');
            hideBannerButton.classList.add('bi-chevron-up');
            window.dispatchEvent(new Event('resize'));
        }
    })
    const chat = document.getElementById('chat');
    const closeChatButton = document.getElementById('chatclose');
    const openChatButton = document.getElementById('chatopen');
    closeChatButton.addEventListener('click', (ev) => {
        chat.style.display = "none";
    })
    openChatButton.addEventListener('click', (ev) => {
        chat.style.display = "";
    })

    const chatSendButton = document.getElementById('chatsend');
    const chatInput = document.getElementById('chatinput');
    chatInput.addEventListener('input', (ev) => {
        chatInput.style.height = "1px";
        chatInput.style.height = (chatInput.scrollHeight)+"px";
    })
    chatInput.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' && !mobileAndTabletCheck()) {
            ev.preventDefault();
            chatSendButton.dispatchEvent(new Event('click'));
        }
    })
    chatSendButton.addEventListener('click', (ev) => {
        const text = chatInput.value.trim();
        if (text && text.length > 0 && !text.match(/^[\n|\t]$/g)) {
            chatInput.value = '';
            submitChatMessage(new ChatMessage(text, null, null, null));
        }
        chatInput.focus();
    })

    initPages();
}

function createOverflowButton(id, elToMove){
    const el = elToMove.parentElement.createElement("div");
    el.setAttribute('id', id);
    el.setAttribute('class', 'bi-three-dots-vertical');
    elToMove.remove();
}

/// misc
function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max)
}

function getEnabledStylesString(){
    return [...enabledStyles.entries()].map(val => val[0] + ':' + val[1]).sort().join(' ');
}

function styleStringToArr(style){
    return (style ?? '').split(' ').map(val => {
        return {code : val.split(':')[0], value : val.split(':')[1]};
    }) ?? [];
}