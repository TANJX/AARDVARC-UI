var classCode = getGetVariable("ClassCode");
var headerClassData = null;
var hostName = window.location.hostname;
var isAGradClass = false;
var changed = false;

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

function getHeader() {
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/EncodeCourseHeader.php",
        'data': {"AccessCode": classCode},
        'success': function (ball) {
            if ((ball.substring(0, 7) == "NOCODE") || (ball.substring(0, 7) == "BADCODE")) {
                $("#CourseTitle").text("Invalid Course Code");
            } else {
                $("#Entry").show();
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
    getFooter();
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

function updateField() {
    $('.ripple').each(function () {
        mdc.ripple.MDCRipple.attachTo($(this)[0]);
    });

    $('.main-wrapper .mdc-icon-button').each(function () {
        const iconButtonRipple = new mdc.ripple.MDCRipple($(this)[0]);
        iconButtonRipple.unbounded = true;
    });
    $("select, input, textarea").change(function () {
        console.log("changed!");
        changed = true;
    });
    $("#main-form button").click(function () {
        console.log("clicked!");
        changed = true;
    });
    $('.mdc-form-field').each(function () {
        var formField = new mdc.formField.MDCFormField($(this)[0]);
        var e = null;
        e = $(this).children(".mdc-checkbox");
        if (typeof e[0] !== "undefined") {
            formField.input = new mdc.checkbox.MDCCheckbox(e[0]);
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

