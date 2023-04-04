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
        $(".default_option li").html(currentele);
        $(this).parents(".select_wrap").removeClass("active");
    })

    var regex = /^[0-9]+$/;

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
    /*input.addEventListener("keydown", );*/
    $("#font-size-input").blur(function () {
        var val = $("#font-size-input").val();
        if (val == "")
            $("#font-size-input").val(last_value);
        else
            $("#font-size-input").val(parseInt(val, 10));
        $("#font-size-input").val(clamp(Number(val), 1, 400));
    });



    var myIFrame = document.getElementById("pane");
    var body = myIFrame.contentWindow.document.body;
    var docc = myIFrame.contentWindow.document;
    var el = docc.createElement("div");
    el.setAttribute('contenteditable', true);
    el.setAttribute('style', 'background-color: white; height: 29.7cm; width: 21.0cm;margin:0; padding:0; overflow:hidden');
    el.textContent = 'AMOGUS DRIPPPP';
    body.appendChild(el);
    myIFrame.contentWindow.document.body = body;
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
