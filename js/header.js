var classCode = getGetVariable("ClassCode");
var headerClassData = null;
var hostName = window.location.hostname;
var isAGradClass = false;
var changed = false;
var invalid = false;

function getGetVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return null;
}

var snackbar_element = null;
var snackbar_complete = true;
var snackbar_timeout_function;

function warn(msg) {
    prompt(msg, 5000, '#fa4f2f');
}

function prompt(msg, time, color) {
    $p = $('<div class="mdc-snackbar mdc-snackbar--align-start"' +
        ' aria-live="assertive"' +
        ' aria-atomic="true"' +
        ' aria-hidden="true">' +
        '<div class="mdc-snackbar__text"></div>' +
        '<div class="mdc-snackbar__action-wrapper">' +
        '<button type="button" class="mdc-snackbar__action-button"></button>' +
        '</div>' +
        '</div>');
    $('body').append($p);
    if (typeof color !== "undefined") {
        $p.css('backgroundColor', color);
    }
    if (typeof time === "undefined") {
        time = 2750;
    }
    if (!snackbar_complete) {
        clearTimeout(snackbar_timeout_function);
    }
    snackbar_element = $p;
    snackbar_complete = false;
    let snackbar = new mdc.snackbar.MDCSnackbar($p[0]);
    setTimeout(function () {
        snackbar.show({
            message: msg,
            timeout: time
        });
    }, 100);
    snackbar_timeout_function = setTimeout(function () {
        snackbar_element.remove();
        snackbar_complete = true;
    }, time + 300);
}

function getHeader() {
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/EncodeCourseHeader.php",
        'data': {"AccessCode": classCode},
        'success': function (ball) {
            if ((ball.substring(0, 7) == "NOCODE") || (ball.substring(0, 7) == "BADCODE")) {
                $("#CourseTitle").text("( Invalid Course Code");
                invalid = true;
            } else {
                var jason = JSON.parse(ball);
                var sinfo = jason.SemesterInfo;
                var cinfo = jason.CourseInfo;
                headerClassData = cinfo;
                $("#CourseTitle").text(cinfo.Title);
                var semString = sinfo.Term + " " + sinfo.Year + ": " + cinfo.CourseID;
                $("#SemesterTitle").text(semString);
                isAGradClass = cinfo.Program == "PhDMS";
            }
        }
    });
    // getFooter();
}

function getFooter() {
    $.ajax({
        'async': true,
        'type': "POST",
        'dataType': 'html',
        'url': "../Resources/Version.html",
        'data': {},
        'success': function (ball) {
            $("#Footer").html(ball);
        }
    });

}

function updateField(div) {
    if (typeof div === "undefined") {
        div = ' ';
    }
    $('.main-wrapper .ripple').each(function () {
        mdc.ripple.MDCRipple.attachTo($(this)[0]);
    });

    $('.main-wrapper .mdc-icon-button').each(function () {
        const iconButtonRipple = new mdc.ripple.MDCRipple($(this)[0]);
        iconButtonRipple.unbounded = true;
    });
    $(div + "select, " + div + "input," + div + "textarea").change(function () {
        console.log("changed!");
        changed = true;
    });
    $(div + "#main-form button").click(function () {
        if (!$(this).hasClass("save-btn")) {
            console.log("clicked!");
            changed = true;
        }
    });
    $(div + '.mdc-form-field').each(function () {
        var formField = new mdc.formField.MDCFormField($(this)[0]);
        var e = $(this).children(".mdc-checkbox");
        if (typeof e[0] !== "undefined") {
            formField.input = new mdc.checkbox.MDCCheckbox(e[0]);
        } else {
            e = $(this).children(".mdc-radio");
            if (typeof e[0] !== "undefined") {
                formField.input = new mdc.radio.MDCRadio(e[0]);
            }
        }

    });
}


class EventData {
    constructor() {
        this.date = null;
        this.startTime = $("#dfltStart").val();
        this.endTime = $("#dfltEnd").val();
        this.description = "";
        this.information = "";
        this.type = eventTypes[0];
        this.instructor = [null];
    }

    ballify() {
        if (this.date == null) {
            var truncDate = null;
        }
        else var truncDate = this.date.toISOString().substring(0, 10);
        var insAry = []
        for (var i in this.instructor) {
            var insFull = this.instructor[i];
            if (insFull != null) {
                var insSmall =
                    insAry.push(insFull.LecturerID);
            }
        }
        var ret = {
            Date: truncDate,
            StartTime: convertWickedPickerFormat(this.startTime),
            EndTime: convertWickedPickerFormat(this.endTime),
            Description: this.description,
            Type: this.type,
            Instructors: insAry,
            Information: this.information
        }
        return ret;
    }

    static fromServer(ob) {
        function blankOrNull(x) {
            if (x == null) return "";
            return x;
        }

        var dflt = new EventData();
        var d = new Date(ob.Date + "T12:00:00");
        dflt.date = d;
        dflt.startTime = ob.StartTime;
        dflt.endTime = ob.EndTime;
        dflt.description = blankOrNull(ob.Description);
        dflt.type = ob.Type;
        dflt.information = blankOrNull(ob.Information);
        dflt.instructor = []
        for (var i in ob.Instructors) {
            for (var j in instructors) {
                var ins = instructors[j];
                if ((ins != null) && (ob.Instructors[i] == ins.LecturerID)) {
                    dflt.instructor.push(ins);
                }
            }
        }
        dflt.instructor.push(null);
        return dflt;
    }
}

