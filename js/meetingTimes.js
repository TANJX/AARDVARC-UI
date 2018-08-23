var DOW_ARY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var eventTypes = ['Lecture', 'Exam', 'Discussion', 'TBL', 'Case Study', 'Laboratory', 'Other'];
var now = new Date();
//List of Instructors in Class
var instructors = [null];
//Faculty Type By Line
var instrLineType = [null];
//1D List of All Faculty
var possibleInstructors = [];
//2D Matrix of All Faculty
var instructorsByType = [];
//List of Faculty Types
var allTypes = [];
//Is a Coordinator
var facCoord = [];
var meetingTimes = [];
var holidays = {};
var enableWarn = false;
var sendDataToURL = "../Server/RecordCourse_Events.php";
var classCode = getGetVariable("ClassCode");

function bootup() {
    var instrInfo;
    var eventInfo;
    var meetInfoLoc = "../Server/EncodeCourseMeet.php";

    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': meetInfoLoc,
        'data': {'AccessCode': classCode},
        'success': function (ball) {
            if (ball.substring(0, 6) == "NOCODE") {
                $("#CourseTitle").text("No Course Code Given");
                return;
            }
            if (ball.substring(0, 7) == "BADCODE") {
                $("#CourseTitle").text("Invalid Course Code");
                return;
            }
            var decoded = JSON.parse(ball);
            var courseInfo = decoded.CourseInfo;
            var DOW = "NNNNNNN";
            if (courseInfo.DOW) DOW = courseInfo.DOW;
            var semInfo = decoded.SemesterInfo;
            eventInfo = decoded.Events;
            instrInfo = decoded.Instructors;
            var facTable = decoded.Faculty;

            var semString = semInfo.Term + " " + semInfo.Year + ": " + courseInfo.CourseID;
            $("#CourseTitle").text(courseInfo.Title);
            $("#SemesterTitle").text(semString);
            $("#startDate").val(courseInfo.StartDate);
            $("#endDate").val(courseInfo.EndDate);
            $("#dfltStart").val(courseInfo.dfltStart);
            $("#dfltEnd").val(courseInfo.dfltEnd);
            setRadioValue("IrregularTimes", courseInfo.IrregularTimes);
            manageHTML5Input();
            var i = 0;
            $('.DOW').each(function () {
                if (DOW.charAt(i) == "Y") this.checked = true;
                i++;
            });
            initializeInstructorList(facTable, instrInfo);
            getHolidays(semInfo);
            applyEventData(eventInfo);
            makeInstructorList();

        }
    });
}

function applyEventData(data) {
    meetingTimes = [];
    for (var i in data) {
        var m = data[i];
        var mo = EventData.fromServer(m);
        meetingTimes.push(mo);
    }
    dispMeetingTimes();
}

function getHolidays(sem) {
    var holidayInfoLoc = "../Server/Holidays.php";
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': holidayInfoLoc,
        'data': {'Year': sem.Year},
        'success': function (ball) {
            //alert(ball);
            var decoded = JSON.parse(ball);
            for (var i in decoded) {
                //alert(JSON.stringify(event));
                var event = decoded[i];
                holidays[event.Date] = event.Title;

            }
        }
    });
}

function deleteInstructorLine(avoid) {
    //alert("Delete! "+avoid);
    var newInstrList = [];
    var newTypeList = [];
    var newCoord = [];
    var removed = null;
    var needCleanse = false;
    for (var i in instructors) {
        e = instructors[i];
        t = instrLineType[i];
        if (i != avoid) {
            newInstrList.push(e);
            newTypeList.push(t);
            newCoord.push(facCoord[i]);
        } else {
            removed = e;
        }
    }
    for (var i in meetingTimes) {
        m = meetingTimes[i];
        for (var j in m.instructor) {
            var e = m.instructor[j];
            if (e == removed) {
                meetingTimes[i].instructor[j] = null;
                needCleanse = true;
            }
        }
    }
    if (needCleanse) cleanseNullInstructors();
    instructors = newInstrList;
    instrLineType = newTypeList;
    facCoord = newCoord;
    makeInstructorList();
    dispMeetingTimes();
}

function applyOldCourse() {
    //alert(JSON.stringify(instructors));
    var text = "";
    for (var i in meetingTimes) {
        var allIns = meetingTimes[i].instructor;
        for (var j in allIns) {
            ins = allIns[j];
            if (ins == null) {
                text += "NULL"
            } else {
                //var ins = possibleInstructors[insIndx];
                var posName = ins.LastName + ", " + ins.FirstName;
                text += posName;
            }
            text += "&"
        }
        //text+=meetingTimes[i].description+"\n";
        text += "\n";
    }
    alert(text);
}

function getDOW() {
    var useDOW = "";
    $('.DOW').each(function () {
        if (this.checked) {
            useDOW += "Y";
        } else {
            useDOW += "N";
        }
    });
    return useDOW;
}

function sendToServer() {
    console.log('saving meetingTimes');
    for (var i in meetingTimes) {
        var m = meetingTimes[i];
        if (m.date == null) {
            alert("Must enter a date for all events");
            return;
        }
        var holidayWarn = getWarningString(m.date);
        if (holidayWarn[0] == 1) {
            alert("Event set for holiday " + holidayWarn[1]);
        }
        if (holidayWarn[0] == 2) {
            alert("Event set " + holidayWarn[1].toLowerCase());
        }

    }
    //var classCode = getGetVariable("ClassCode");
    var instrKeys = [];
    for (var i in instructors) {
        var e = instructors[i];
        var princ = "Principal";
        if (facCoord[i]) princ = "Coord";
        if (e != null) {
            instrKeys.push(
                {ID: e.LecturerID, Coord: princ});
        }
    }

    var mtBall = [];
    for (var i in meetingTimes) {
        var m = meetingTimes[i];
        mtBall.push(m.ballify());
    }
    var ball =
        {
            code: classCode,
            allInstructors: instrKeys,
            dfltStart: convertWickedPickerFormat($("#dfltStart").val()),
            dfltEnd: convertWickedPickerFormat($("#dfltEnd").val()),
            DOW: getDOW(),
            StartDate: document.getElementById("startDate").value,
            EndDate: document.getElementById("endDate").value,
            IrregularTimes: getRadioValue("IrregularTimes"),
            meetingTimes: mtBall
        };
    console.log(ball);
    //alert(JSON.stringify(meetingTimes));
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': sendDataToURL,
        'data': ball,
        'success': function (data) {
            if (data.substring(0, 7) == "SUCCESS") {
                prompt("Meeting Times Saved!");
            } else {
                var w = window.open();
                $(w.document.body).html(data);
            }
        }
    });
}

function setRadioValue(id, key) {
    var options = document.getElementsByName(id);
    for (var i = 0; i < options.length; i++) {
        if (options[i].value == key) options[i].checked = true;
    }
    return null;
}

function getRadioValue(id) {
    var options = document.getElementsByName(id);
    for (var i = 0; i < options.length; i++) {
        if (options[i].checked) {
            return options[i].value;
        }
    }
    return null;
}

function ensureMTInstructorValidity() {
    //alert("Checking");
    for (var i in meetingTimes) {
        //alert("Meet "+i);
        for (var j in meetingTimes[i].instructor) {
            var ins = meetingTimes[i].instructor[j];
            if (ins == null) continue;
            //alert(ins.LastName);
            var valid = false;
            for (var k in instructors) {
                if (instructors[k] == ins) {
                    valid = true;
                    break;
                }
            }
            //alert(valid);
            if (!valid) {
                meetingTimes[i].instructor[j] = null;
            }
        }
    }
    cleanseNullInstructors();
}

function safeInitials(v) {
    if (v == null) return "NULL";
    return v.Initials;
}

function cleanseNullInstructors() {
    for (var m in meetingTimes) {
        cleanseNullInstructorsThisMeeting(m);
    }
}

function cleanseNullInstructorsThisMeeting(m) {
    //alert(m);
    var newAry = []
    for (var k in meetingTimes[m].instructor) {
        var val = meetingTimes[m].instructor[k];
        if (val != null) newAry.push(val);
    }
    newAry.push(null);
    meetingTimes[m].instructor = newAry;
}

function sameDay(d1, d2) {
    return d1.getFullYear() == d2.getFullYear() &&
        d1.getMonth() == d2.getMonth() &&
        d1.getDate() == d2.getDate();
}

function findPrexistingMeetingTimes(seek) {
    for (var i in meetingTimes) {
        mt = meetingTimes[i];
        //alert(mt.date+"\n"+seek);
        if (sameDay(mt.date, seek)) {
            return mt;
        }
    }
    return null;
}

function addMeetingTimes() {
    var useDOW = [];
    $('.DOW:checked').map(function () {
        useDOW.push($(this).val());
    });
    newMeetingTimes = [];

    var cursor = new Date($("#startDate").val() + "T12:00");
    var cease = new Date($("#endDate").val() + "T12:00");
    while (cursor <= cease) {
        if (inArray(cursor.getDay(), useDOW)) {
            var meetDate = new Date(cursor);
            var alreadyExists = findPrexistingMeetingTimes(cursor);
            if (alreadyExists == null) {
                var newEvent = new EventData();
                newEvent.date = meetDate;
                newMeetingTimes.push(newEvent);
            } else {
                newMeetingTimes.push(alreadyExists);
            }
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    meetingTimes = newMeetingTimes;
    dispMeetingTimes();
}

function timeToDouble(ts) {
    var chop = ts.split(":");
    var hour = parseFloat(chop[0]);
    var minute = parseFloat(chop[1]) / 60.0;
    return hour + minute;
}

function meetTimeSanity(m) {
    var start = timeToDouble(m.startTime);
    var end = timeToDouble(m.endTime);
    var duration = end - start;
    if (start > end) alert("Start time is later than end time\nSystem may not accomodate events that pass midnight correctly");
    if (duration > 5) alert("Event is longer than 5 hours\nPlease ensure AM/PM is correct");
}

function makeTimeElements(m) {
    var $ret = $("<div class='form-section grid-2'></div>");

    var $ret1 = $("<div class='half left'></div>");
    $ret1.append('<label for="startDate" class="m-t-10px">Class Starts:</label>');
    var $start = $("<input type='time' value=" + meetingTimes[m].startTime + ">");
    $start.change(function () {
        meetingTimes[m].startTime = this.value;
    });
    $ret1.append($start);

    var $ret2 = $("<div class='half right'></div>");
    $ret2.append('<span></span>');
    $ret2.append('<label for="startDate" class="m-t-10px">Class Ends:</label>');
    var $end = $("<input type='time' value=" + meetingTimes[m].endTime + ">");
    $end.change(function () {
        meetingTimes[m].endTime = this.value;
    });
    $ret2.append($end);
    $ret.append($ret1);
    $ret.append($ret2);
    if (Modernizr.inputtypes.time) {
        $start.blur(function () {
            meetTimeSanity(meetingTimes[m]);
        });
        $end.blur(function () {
            meetTimeSanity(meetingTimes[m]);
        });
    } else {
        var options = {now: $start.val(), minutesInterval: 5};
        $start.wickedpicker(options);
        options = {now: $end.val(), minutesInterval: 5};
        $end.wickedpicker(options);
    }

    return $ret;
}

function makeLectureTitle(m) {
    var $ret = $("<div class='form-section full'></div>");
    $ret.append("<label class='m-t-10px'>Title:</label>");
    var $input = $("<input type='text' value='" + meetingTimes[m].description + "'>");
    $input.change(function () {
        meetingTimes[m].description = this.value;
    });
    $ret.append($input);
    return $ret;
}

function makeLectureInfo(m) {
    var $ret = $("<div class='form-section'></div>");
    $ret.append("<label>Additional course information:</label>");
    var $textarea = $("<textarea rows='4' class='m-t-10px'>" + meetingTimes[m].information + "</textarea>");
    $textarea.change(function () {
        meetingTimes[m].information = this.value;
    });
    $ret.append($textarea);
    $ret.append("<div class='input-helper'>" +
        "<i>Reading, Objectives, Assignments for this lecture or due later...</i>" +
        "</div>");
    return $ret;
}

function makeTypeSelector(m) {
    var $grid = $('<div class="form-section grid-2"></div>')
    var $div = $("<div class='half left'></div>");
    $div.append("<label class='m-t-10px'>Lecture Type: </label>");
    var $newdivDropdown = $("<select></select>");
    for (var i in eventTypes) {
        et = eventTypes[i];
        $newdivDropdown.append($('<option>', {
            value: et,
            text: et,
            selected: (et == meetingTimes[m].type)
        }));
    }
    $newdivDropdown.change(function () {
        meetingTimes[m].type = this.value;
    });
    $div.append($newdivDropdown);
    $grid.append($div);
    return $grid;
}

function getDayString(date) {
    if (date == null) {
        return "Blank";
    }
    var dowI = date.getDay();
    return DOW_ARY[dowI];
}

function getWarningString(date) {
    //0 means event has no conflict
    //1 means event is on a holiday
    //2 means event is outside of the course start or end dates
    var courseBegin = new Date($("#startDate").val() + "T01:00");
    var courseEnd = new Date($("#endDate").val() + "T23:00");
    if (date > courseEnd) {
        return [2, "After Course End"];
    }
    if (date < courseBegin) {
        return [2, "Before Course Start"];
    }
    var key = date.toISOString().substring(0, 10);
    if (key in holidays)
        return [1, holidays[key]];
    return [0, ""];
}

function makeDateSelector(m) {
    var $ret = $("<div class='form-section grid-2'></div>")
    var $ret0 = $("<div class='half left' style='position: relative'></div>")
    var $delete = $("<button type='button' class='mdc-icon-button material-icons delete-btn' " +
        "style='margin-left: 5px;'>" +
        "<i class='material-icons'>delete</i>" +
        "</button>");
    var $label = $("<label class='m-t-10px bold'></label>");
    var $warn = $("<b class = 'holiday' style='position: absolute; right: -120px;  top: 15px  '></b>");
    $label.text(getDayString(meetingTimes[m].date));
    $warn.text(getWarningString(meetingTimes[m].date)[1]);
    $ret0.append($label);

    if (Modernizr.inputtypes.date) {
        var $widget = $("<input type='date' id='meetDate'>");
    } else {
        var $widget = $("<input type='date' id='meetDate'>").datepicker({dateFormat: 'yy-mm-dd'});
    }
    if (meetingTimes[m].date != null) {
        $widget.val(meetingTimes[m].date.toISOString().substring(0, 10));
    }


    $widget.change(function () {
        if (meetingTimes[m].date == null) {
            meetingTimes[m].date = new Date(this.value + "T12:00");
        } else {
            var chop = this.value.split("-");
            meetingTimes[m].date.setFullYear(chop[0]);
            meetingTimes[m].date.setMonth(chop[1] - 1);
            meetingTimes[m].date.setDate(chop[2]);
        }
        $label.text(getDayString(meetingTimes[m].date));
        $warn.text(getWarningString(meetingTimes[m].date)[1]);
        enableWarn = true;
        //alert(JSON.stringify(holidays));

    });
    $delete.click(function () {
        newMT = []
        for (var i in meetingTimes) {
            if (i != m) newMT.push(meetingTimes[i]);
        }
        meetingTimes = newMT;
        dispMeetingTimes();
    });
    $ret0.append($widget);
    $ret0.append($delete);
    $ret0.append($warn);
    $ret.append($ret0);
    return $ret;
}

function makeAddObject(m) {
    var $ret = $("<div></div>");
    var addbtn = $("<button type='button' class='mdc-icon-button material-icons'>" +
        "<i class='material-icons'>add</i>" +
        "</button>");
    var savebtn = $("<button type='button' class='mdc-icon-button material-icons save-btn'>" +
        "<i class='material-icons'>save</i>" +
        "</button>");
    addbtn.click(function () {
        //alert("I\nSir\nDo Exist\n"+m);
        var newMT = [];
        for (var i in meetingTimes) {
            if (i == m) {
                var newEvent = new EventData();
                newMT.push(newEvent);
            }
            newMT.push(meetingTimes[i]);
        }
        if (m == meetingTimes.length) {
            var newEvent = new EventData();
            newMT.push(newEvent);
        }
        meetingTimes = newMT;
        //alert(newMT.length);
        dispMeetingTimes();
        window.scrollBy(0, 115);
    });
    savebtn.click(function () {
        save();
    });
    $ret.append(addbtn);
    $ret.append(savebtn);
    // var $save = $("<button type='button' id='SendToServer'>Save</button>");
    // $save.click(sendToServer());
    // $ret.append($save);
    return $ret;
}

function dispMeetingTimes() {
    var mText = "";
    var $mtDiv = $("#MeetingTimes-div");
    $mtDiv.html("");
    for (var i in meetingTimes) {
        var $sub = $("<div class='form-section'></div>");
        var meet = meetingTimes[i];
        $sub.append(makeAddObject(i));
        $sub.append(makeDateSelector(i));
        $sub.append(makeTimeElements(i));
        $sub.append(makeLectureTitle(i));
        $sub.append(makeTypeSelector(i));
        $sub.append(makeInstructorEventSelection(i));
        $sub.append(makeLectureInfo(i));
        $sub.append("<hr style='margin-top: 50px'>");
        $mtDiv.append($sub);
    }
    $mtDiv.append(makeAddObject(meetingTimes.length));
    updateField('#MeetingTimes-div');
}

function convertWickedPickerFormat(sel) {
    if (Modernizr.inputtypes.time) return sel;
    var split = sel.split(":");
    var hour = parseInt(split[0]);
    var postNoon = split[1].slice(-2);
    var minute = split[1].substring(1, 3);
    if (hour == 12) hour = 0;
    if (postNoon == "PM") hour += 12;
    return hour + ":" + minute + ":00";

}

function manageHTML5Input() {
    if (!Modernizr.inputtypes.date) {
        $(':input[type=date]').each(function () {
            $(this).datepicker({dateFormat: 'yy-mm-dd'});
        });
    }
    if (!Modernizr.inputtypes.time) {
        $(':input[type=time]').each(function () {
            var options = {now: $(this).val(), minutesInterval: 5};
            $(this).wickedpicker(options);
        });
    }
}
