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
        $('#firstName').text(res);
        var firstName = $('#firstName').text();
        var lastName = $('#lastName').text();
        var intials = $('#firstName').text().charAt(0) + $('#lastName').text().charAt(0);
        var profileImage = $('#currentImage').text(intials);
    };
    userAction.apply();

    $("#bold-button").click(function () {
        if (bold){
            bold = false;
            enabledStyles.delete(STYLE_CODES.BOLD);
            $(this).removeClass('active');
        }
        else{
            bold = true;
            enabledStyles.set(STYLE_CODES.BOLD, 1);
            $(this).addClass('active');
        }
    });
    $("#italic-button").click(function () {
        if (italic){
            italic = false;
            enabledStyles.delete(STYLE_CODES.ITALIC);

            $(this).removeClass('active');
        }
        else{
            italic = true;
            enabledStyles.set(STYLE_CODES.ITALIC, 1);
            $(this).addClass('active');
        }
    });
    $("#underline-button").click(function () {
        if (underline){
            underline = false;
            enabledStyles.delete(STYLE_CODES.UNDERLINE);
            $(this).removeClass('active');
        }
        else{
            underline = true;
            enabledStyles.set(STYLE_CODES.UNDERLINE, 1);
            $(this).addClass('active');
        }
    });
    $("#strikethrough-button").click(function () {
        if (strikethrough){
            strikethrough = false;
            enabledStyles.delete(STYLE_CODES.STRIKETHROUGH);
            $(this).removeClass('active');
        }
        else{
            strikethrough = true;
            enabledStyles.set(STYLE_CODES.STRIKETHROUGH, 1);
            $(this).addClass('active');
        }
    });


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
                var currentele = $(liEl).html();
                const wrap = $(liEl).parents(".select_wrap");
                wrap.children("ul .default_option").html(currentele);
                wrap.removeClass("active");
            })

            if (key === '0' || key === 0) {
                fontEl.appendChild(liEl.cloneNode(true));
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
    $(".select_wrap .select_ul li").click(function () {
        var currentele = $(this).html();
        const wrap = $(this).parents(".select_wrap");
        wrap.children("ul .default_option").html(currentele);
        wrap.removeClass("active");
    })
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