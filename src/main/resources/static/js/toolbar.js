function toolbarSetup() {
    const userAction = async () => {
        const response = await fetch('http://localhost:8082/rest/generate-id');
        const res = await response.text(); //extract JSON from the http response
        $('#firstName').text(res);
        var firstName = $('#firstName').text();
        var lastName = $('#lastName').text();
        var intials = $('#firstName').text().charAt(0) + $('#lastName').text().charAt(0);
        var profileImage = $('#currentImage').text(intials);
    };
    userAction.apply();

    $(".default_option").click(function () {
        $(this).parent().toggleClass("active");
    })

    $(".select_ul li").click(function () {
        var currentele = $(this).html();
        const wrap = $(this).parents(".select_wrap");
        wrap.children("ul .default_option").html(currentele);
        wrap.removeClass("active");
    })

    const regex = /^[0-9]+$/;
    var pageWidth = '21.0cm';
    var pageHeight = '29.7cm';

    $("#zoom").on('DOMSubtreeModified', function(){
        const val = Number($(this).children("div .option").text().replace('%', '').trim())/100.;
        const pane = $("#pane");

        const oldPaneHeight = pane.height();
        const oldPaneWidth = pane.width();

        pane.css('scale', val.toString());

        const newPaneHeight = pane.height();
        const newPaneWidth = pane.width();

        const deltaHeight = newPaneHeight - oldPaneHeight;
        const deltaWidth = newPaneWidth - oldPaneWidth;

        $("#tmp").height($("#tmp").height() + deltaHeight);

        var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        var bannerHeight = banner.offsetHeight;
        paneHolder.height(vh - bannerHeight);
    });

    var last_value = 11;
    $("#font-size-input").val(last_value);

    //handling button entry for font size
    $("#font-size-minus").click(function () {
        var val = clamp($("#font-size-input").val() - 1, 1, 400)
        $("#font-size-input").val(val);
        last_value = val;
    })

    $("#font-size-plus").click(function () {
        var val = clamp(Number($("#font-size-input").val()) + 1, 1, 400)
        $("#font-size-input").val(val);
        last_value = val
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
        if (val == "")
            $("#font-size-input").val(last_value);
        else
            $("#font-size-input").val(parseInt(val, 10));
        $("#font-size-input").val(clamp(Number(val), 1, 400));
    });


    //editor page itself
    const myIFrame = document.getElementById("pane");
    const banner = document.getElementById("banner");
    const paneHolder = $("#pane-holder");
    addEventListener("resize", (event) =>
    {
        var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        var bannerHeight = banner.offsetHeight;
        paneHolder.height(vh - bannerHeight);
    });
    var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    var bannerHeight = banner.offsetHeight;
    paneHolder.height(vh - bannerHeight);

    //myIFrame.setAttribute('style', myIFrame.getAttribute('style') + '; width: ' + pageWidth);
    //myIFrame.setAttribute('style', myIFrame.getAttribute('style') + '; height: ' + pageHeight);
    var body = myIFrame.contentWindow.document.body;
    var docc = myIFrame.contentWindow.document;
    var el = docc.createElement("div");
    el.setAttribute('contenteditable', true);
    el.setAttribute('style', 'background-color: white; margin:0; padding:0; overflow:hidden; outline: 0px solid transparent;');
    el.setAttribute('style', el.getAttribute('style')+'; width: ' + pageWidth);
    el.setAttribute('style', el.getAttribute('style')+'; height: ' + pageHeight);
    el.textContent = 'AMOGUS DRIPPPP';
    body.appendChild(el);
    var el2 = docc.createElement("div");
    el2.setAttribute('style', 'height: 40px');
    body.appendChild(el2);
    var el3 = docc.createElement("div");
    el3.setAttribute('contenteditable', true);
    el3.setAttribute('style', 'background-color: white; margin:0; padding:0; overflow:hidden; outline: 0px solid transparent;');
    el3.setAttribute('style', el.getAttribute('style')+'; width: ' + pageWidth);
    el3.setAttribute('style', el.getAttribute('style')+'; height: ' + pageHeight);
    el3.textContent = 'AMOGUS DRIPPPP2';
    body.appendChild(el3);
    body.setAttribute('style', 'overflow:hidden;');
    myIFrame.contentWindow.document.body = body;

    resizeIFrameToFitContent(myIFrame);
}

function resizeIFrameToFitContent( iFrame ) {
    iFrame.width  = iFrame.contentWindow.document.body.scrollWidth;
    iFrame.height = iFrame.contentWindow.document.body.scrollHeight;
}

function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max)
}

function createOverflowButton(id, elToMove){
    const el = elToMove.parentElement.createElement("div");
    el.setAttribute('id', id);
    el.setAttribute('class', 'bi-three-dots-vertical');
    elToMove.remove();
}

function addUser(name, avatar){

}
