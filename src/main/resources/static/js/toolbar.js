function toolbarSetup() {

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

    //font-selector
}

function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max)
}
