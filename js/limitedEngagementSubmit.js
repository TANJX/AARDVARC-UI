function bootup() {
    instructorCode = getGetVariable("Instructor");
    if (instructorCode == null) {
        $("#formTitle").text("Invalid Instructor Code");
        $("#Entry").hide();
        return;
    }
    getInstructorData();
}

function getInstructorData() {
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/EncodeSingleInstructor.php",
        'data': {"Instructor": instructorCode},
        'success': function (ball) {
            instructorData = JSON.parse(ball);
            if (instructorData == null) {
                $("#formTitle").text("Invalid Instructor");
                $("#Entry").hide();
                return;
            }
            $("#insName").text(instructorData.FirstName + " " + instructorData.LastName);
            getFormData(true);
            var doLock = lockout();
            if (doLock) {
                $("#Entry").hide();
                return;
            } else {
                $("#Entry").show();

            }
        }
    });

}

function getFormData(booting){
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/EncodeLimitedEngagementRecord.php",

        'data':{"Instructor":instructorCode,"ClassCode":headerClassData.AccessCode},
        'success': function (ball) {
            if (ball == "Instructor Code Invalid"){
                $("#formTitle").text("Invalid Instuctor Code");
                return;
            }
            if (ball == "No LE Form"){
                $("#formTitle").text("No Limited Engagement Form Has Been Created For This Instructor & Course");
                return;
            }
            var jason = JSON.parse(ball);
            formData = jason;
            formDue = jason.Due;
            if (jason.Filepath){
                hasFilepath = true;
            }
        }
    });
}

function backToForm() {
    var lecIdGetParam = "&Instructor=" + instructorCode;
    window.location = "LimitedEngagementForm.html?ClassCode=" + classCode + lecIdGetParam;
}

function lockout() {
    if (formData.Submitted == "Yes") {
        $("#formTitle").text("This form has already been submitted");
        return true;
    }
    if ((formData.Filepath == "") || (formData.Filepath == null)) {
        $("#formTitle").text("No document file exists for this form");
        return true;
    }
    return false;
}

function makeDocument() {
    if ($("#coordName").val() == "") {
        alert("Must enter your name");
        return;
    }
    var ball = {
        "AccessCode": headerClassData.AccessCode,
        "LecturerID": instructorCode,
        "Mode": "SUBMIT",
        "Submitter": $("#coordName").val()
    };
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/NewLimitedEngagementRecord.php",
        'data': ball,
        'success': function (data) {
            if (data.substring(0, 8) == "ACCEPTED") {
                $("#Entry").hide();
                $("#formTitle").text("Limited Engagement Form Submitted");
                window.open("http://pharmacysyllabus.usc.edu/Syllabus/Server/MakeDocLimitedEngagement.php?Submit=Yes&ClassCode=" + headerClassData.AccessCode + "&InstructorCode=" + instructorCode);
            } else {
                var w = window.open();
                $(w.document.body).html(data);
            }
            wait = false;
        }
    });
}