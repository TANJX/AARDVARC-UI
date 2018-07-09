function initializeInstructorList(facultyTable, facInClass) {
    instructorsByType = facultyTable;
    possibleInstructors = [];
    var typeDict = {};
    for (var i in facultyTable) {
        if (facultyTable[i].length > 0) {
            typeDict[i] = allTypes.length;
            allTypes.push(i);
        }
        for (var j in facultyTable[i]) {
            possibleInstructors.push(facultyTable[i][j]);
        }
    }
    instructors = [];
    instrLineType = [];
    for (var i in facInClass) {
        insServe = facInClass[i];
        for (var j in possibleInstructors) {
            insPos = possibleInstructors[j];

            if (insPos.LecturerID == insServe.LecturerID) {
                //alert("Push! "+insPos.Status);
                instructors.push(insPos);
                //alert(JSON.stringify(insServe));
                instrLineType.push(typeDict[insPos.Status]);
                facCoord.push(insServe.Principal == "Coord");
            }
        }
    }
    instructors.push(null);
    instrLineType.push(null);
}

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
var sendDataToURL = "../Server/RecordCourse_Lecturer.php";
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
            $("#Panel").show();
            var decoded = JSON.parse(ball);
            instrInfo = decoded.Instructors;
            var facTable = decoded.Faculty;


            initializeInstructorList(facTable, instrInfo);
            makeInstructorList();
            getHeader();
        }
    });
}

function addInstructorLine() {
    //alert("New Guy! "+instructors.length);
    var newList = [];
    for (var i in instructors) {
        e = instructors[i];
        if (e != null) {
            newList.push(e);
        }
    }
    newList.push(possibleInstructors[0]);
    newList.push(null);
    instructors = newList;
    makeInstructorList();
    dispMeetingTimes();
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
    if (needCleanse) cleanseNullInstructors();
    instructors = newInstrList;
    instrLineType = newTypeList;
    facCoord = newCoord;
    makeInstructorList();
}

function openNewTab(myUrl, myData) {
    var res = null;
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': myUrl,
        'data': myData,
        'success': function (data) {
            res = data;
        }
    });
    var w = window.open();
    $(w.document.body).html(res);
}

function sendToServer() {
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
    var ball =
        {
            code: classCode,
            allInstructors: instrKeys
        };
    //alert(JSON.stringify(meetingTimes));
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': sendDataToURL,
        'data': ball,
        'success': function (data) {
            if (data.substring(0, 7) == "SUCCESS") {
                alert("Data successfully sent to database");
            } else {
                var w = window.open();
                $(w.document.body).html(data);
            }
        }
    });
}

function makeInstructorTypeDiv(i) {
    //alert(i+"   "+instrLineType[i]);
    var myType = allTypes[instrLineType[i]];
    var $newdiv = $("<div class='entry'></div>;");
    var nulltext = "Select Instructor";
    var inti = parseInt(i);
    if ((inti + 1) >= instructors.length) {
        var nulltext = "Add Instructor";
    }

    var $typeDropdown = $("<select class='select-type'></select>");
    $typeDropdown.append($('<option>', {
        value: "null",
        text: nulltext,
        selected: (instrLineType[i] == null),
        disabled: true
    }));
    for (var j in allTypes) {
        $typeDropdown.append($('<option>', {
            value: j,
            text: allTypes[j],
            selected: (instrLineType[i] == j)
        }));
    }
    $typeDropdown.change(function () {

        var wasNull = (instrLineType[i] == null);
        instrLineType[i] = this.value;
        if (this.value == "null") {
            // deleteInstructorLine(i);
        } else {
            instructors[i] = instructorsByType[allTypes[this.value]][0];
            if (wasNull) {
                instrLineType.push(null);
                instructors.push(null);
                facCoord.push(false);
            }
        }
        makeInstructorList()
    });
    $newdiv.append($typeDropdown);
    if (myType != null) {
        //alert("not null "+myType);
        //alert(JSON.stringify(instructorsByType[myType]));
        var $instrDropdown = $("<select class='select-instructor'></select>");
        $instrDropdown.append($('<option>', {
            value: "null",
            text: "Select Instructor",
            selected: false,
            disabled: true
        }));
        for (var j in instructorsByType[myType]) {
            var pos = instructorsByType[myType][j];
            var posName = pos.LastName + ", " + pos.FirstName;
            $instrDropdown.append($('<option>', {
                value: j,
                text: posName,
                selected: (instructors[i] == pos)
            }));
            $instrDropdown.change(function () {
                if (this.value == "null") {
                    instructors[i] = null;
                } else {
                    instructors[i] = instructorsByType[myType][this.value];
                }
            });
        }
        $newdiv.append($instrDropdown);

        var $CoordDropdown = $("<select class='select-coord'></select>");
        $CoordDropdown.append($('<option>', {
            value: "Y",
            text: "Coordinator",
            selected: facCoord[i]
        }));
        $CoordDropdown.append($('<option>', {
            value: "N",
            text: "Not a Coordinator",
            selected: !facCoord[i]
        }));
        $CoordDropdown.change(function () {
            facCoord[i] = (this.value == "Y");
        });
        $newdiv.append($CoordDropdown);
    }

    if (myType != null) {
        var $delete_btn = $("<button type='button' class='mdc-icon-button material-icons'>" +
            "<i class='material-icons'>close</i>" +
            "</button>");
        $delete_btn.click(function () {
            deleteInstructorLine(i);
        });
        $newdiv.append($delete_btn);
    }
    return $newdiv;
}

function makeInstructorList() {
    $("#InstructorList").html("");
    for (var i in instructors) {
        instr = instructors[i];
        var $newDiv = makeInstructorTypeDiv(i);
        $("#InstructorList").append($newDiv);
    }
}

function inArray(key, arr) {
    for (var i in arr) {
        var v = arr[i];
        if (v == key) return true;
    }
    return false;
}

function safeInitials(v) {
    if (v == null) return "NULL";
    return v.Initials;
}

function makeInstructorEventSelection(m) {
    var $ret = $("<div></div>");
    var meetObj = meetingTimes[m];
    var meetIns = meetObj.instructor;
    for (var i = 0; i < meetIns.length; i++) {
        var $newdivDropdown = makeInstructorDropdown(m, i);
        $ret.append($newdivDropdown);
        $ret.append("<br>");
    }
    return $ret;
}

function makeInstructorDropdown(m, j) {
    instrCompare = meetingTimes[m].instructor[j];
    var $newdivDropdown = $("<select></select>");
    for (var i in instructors) {
        instr = instructors[i];
        if (instr == null) {
            if (j == meetingTimes[m].instructor.length - 1) {
                var instrName = "Add Lecturer";
            } else {
                var instrName = "Remove Lecturer";
            }
        } else {
            var instrName = instr.LastName + ", " + instr.FirstName;
        }
        $newdivDropdown.append($('<option>', {
            value: i,
            text: instrName,
            selected: (instrCompare == instr)
        }));

    }
    $newdivDropdown.change(function () {
        if (meetingTimes[m].instructor[j] == null) {
            meetingTimes[m].instructor.push(null);
        }
        meetingTimes[m].instructor[j] = instructors[this.value];
        if (instructors[this.value] == null) {
            cleanseNullInstructorsThisMeeting(m);
        }
        dispMeetingTimes();
    });
    return $newdivDropdown;
}

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
