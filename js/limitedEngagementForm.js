var instructorCode;
var instructorData;
var formData;
var formDue;


function goPage(pagename, extras = "") {
    window.location = "../Coord/" + pagename + ".html?ClassCode=" + classCode + extras;
}

function setTextFieldValue(id, s) {
    let textfield = new mdc.textField.MDCTextField($("#" + id).parent()[0]);
    textfield.value = s;
}

function getInstructorData() {
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/EncodeSingleInstructor.php",
        'data': {"Instructor": instructorCode},
        'success': function (ball) {
            var jason = JSON.parse(ball);
            setTextFieldValue("lastName", jason.LastName);
            setTextFieldValue("middleName", jason.MiddleInitial);
            setTextFieldValue("firstName", jason.FirstName);
            setTextFieldValue("insTelephone", jason.Phone);
            setTextFieldValue("insEmail", jason.Email);
            setTextFieldValue("address1", jason.Address1);
            setTextFieldValue("address2", jason.Address2);
            setTextFieldValue("addressCityState", jason.CityStateZip);
            setTextFieldValue("addressCountry", jason.Country);
            instructorData = jason;
            $("#" + jason.USStatus).attr('checked', 'checked');
        }
    });
}

function getFormData(booting) {
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/EncodeLimitedEngagementRecord.php",

        'data': {"Instructor": instructorCode, "ClassCode": headerClassData.AccessCode},
        'success': function (ball) {
            if (ball == "Instructor Code Invalid") {
                $("#formTitle").text("Invalid Instuctor Code");
                return;
            }
            if (ball == "No LE Form") {
                $("#formTitle").text("No Limited Engagement Form Has Been Created For This Instructor & Course");
                return;
            }
            var jason = JSON.parse(ball);
            formData = jason;
            formDue = jason.Due;

            $("#startDate").val(jason.StartDate);
            $("#endDate").val(jason.EndDate);
            $("#hourCount").text(jason.Hours);
            $("#CustomJustification").text(jason.CustomJustification);
            if (booting) $("#paymentAmount").val(jason.PaymentAmount);
            if (jason.DefaultPay == "Yes") {
                $("#paymentAmount").val(jason.PaymentAmount);
                $("#paymentAmount").prop('disabled', true);
            }
            if (jason.Filepath) {
                hasFilepath = true;
            }
            if (jason.Submitted == "Yes") {
                $("#formTitle").text("Limited Engagement Form Submitted");
                $("#Entry").hide();
                return;
            }
            $("#Entry").show();
        },
        'error': function () {
            alert("Here");

        },
    });
}

var hasFilepath = false;
const GUEST_KEY = "__GUEST__";
const PEER_KEY = "__PEER__";
const ALERT_PAYMENT = 10000;


function checkHighPayment() {
    if ($("#paymentAmount").val() >= ALERT_PAYMENT) {
        $("#paymentWarning").text("Warning! Payments over 10k require special approval");
    } else {
        $("#paymentWarning").text("");
    }
}

function checkSubmissionOld() {
    var edate = new Date($("#endDate").val() + "T23:00");
    var today = new Date();
    if (edate < today) {
        if (hasFilepath) {
            console.log("SubmitDoc show");
            $("#SubmitDoc").show();
        }
    }
    //if (edate);
}

function checkSubmission() {
    if ((hasFilepath) && (formDue)) $("#SubmitDoc").show();
}

function updateDataFromSyllabus() {
    var ball = {"AccessCode": headerClassData.AccessCode, "LecturerID": instructorCode, "Mode": "UPDATE"};
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/NewLimitedEngagementRecord.php",
        'data': ball,
        'success': function (data) {
            if (data.substring(0, 7) == "SUCCESS") {
                getFormData(false);
            } else {
                var w = window.open();
                $(w.document.body).html(data);
            }
            wait = false;
        }
    });
}

function itemActions() {
    if (formData.DefaultPay == "No") $("#JustificationArea").show();
    $("#payForGuestSpeaker").change(function () {
        var setOn = $(this).prop("checked");
        if (setOn) {
            $("#payForPeerReview").prop('checked', false);
            $("#payForOther").val("");
        }
    });
    $("#payForPeerReview").change(function () {
        var setOn = $(this).prop("checked");
        if (setOn) {
            $("#payForGuestSpeaker").prop('checked', false);
            $("#payForOther").val("");
        }
    });
    $("#payForOther").click(function () {
        $("#payForGuestSpeaker").prop('checked', false);
        $("#payForPeerReview").prop('checked', false);
    });
    $("#SendToServer").click(function () {
        send();
    });
    $("#SeeDoc").click(genDoc);
    $("#UpdateData").click(function () {
        updateDataFromSyllabus();
    });
    $("#paymentAmount").change(checkHighPayment);
    $("#SubmitDoc").click(submitDocument);
}

function readyToGen() {
    if (getRadioValue("USCitzenship") == null) {
        warn("Must choose citizenship status");
        return false;
    }
    var paymentQuant = parseFloat($("#paymentAmount").val());
    if (Number.isNaN(paymentQuant)) {
        warn("Payment quantity not valid");
        return false;
    }
    if ((document.getElementById("startDate").value == "") || (document.getElementById("endDate").value == "")) {
        warn("Must have valid start and end date");
        return false;
    }
    if (($("#address1").val() == "") || ($("#addressCityState").val() == "")) {
        warn("Must have address");
        return false;
    }
    if (formData.DefaultPay == "No") {
        var justificationText = $("#CustomJustification").val();
        if (justificationText.length < 10) {
            warn("Must enter a justification for custom payment");
            return false;
        }
    }
    return true;
}

function genDoc() {
    if (readyToGen()) {
        $('#SeeDoc').attr('disabled', true);
        $('#pdf-status').show();

        send();
        const xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                console.log("gen complete");
                $('#pdf-status').hide();
                $('#gen-result').show();
                var text = this.responseText;
                $('#gen-result').append($(text));
                // document.getElementById("gen-result").innerHTML = this.responseText;

                $('#gen-result button').each(function () {
                    mdc.ripple.MDCRipple.attachTo($(this)[0]);
                });
            }
        };
        xmlhttp.open("GET",
            '../Server/MakeDocLimitedEngagement.php?ClassCode=' + classCode + '&InstructorCode=' + instructorCode);
        xmlhttp.send();
    }
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

function getPaymentForValue() {
    if ($("#payForGuestSpeaker").prop("checked")) return GUEST_KEY;
    if ($("#payForPeerReview").prop("checked")) return PEER_KEY;
    var text = $("#payForOther").val();
    if ((text == GUEST_KEY) || (text == PEER_KEY)) text = "_" + text + "_";
    return text;
}

function submitDocument() {
    //alert("This feature is not yet live");
    //return;
    if (readyToGen()) {
        readyToGen();
        var lecIdGetParam = "&Instructor=" + instructorCode;
        window.location = "LimitedEngagementSubmit.html?ClassCode=" + classCode + lecIdGetParam;
    }
}

function backToEditor() {
    window.location = "page.html?page=LimitedEngagementByClass&ClassCode=" + classCode;
}

function send() {
    var basicInfo = {
        "LecturerID": instructorData.LecturerID,
        "LastName": $("#lastName").val(),
        "FirstName": $("#firstName").val(),
        "MiddleInitial": $("#middleName").val(),
        "Phone": $("#insTelephone").val(),
        "Email": $("#insEmail").val(),
        "USStatus": getRadioValue("USCitzenship"),
        "Address1": $("#address1").val(),
        "Address2": $("#address2").val(),
        "CityStateZip": $("#addressCityState").val(),
        "Country": $("#addressCountry").val()
    };
    var formInfo = {
        "PaymentAmount": $("#paymentAmount").val(),
        "StartDate": document.getElementById("startDate").value,
        "EndDate": document.getElementById("endDate").value,
        "CustomJustification": $("#CustomJustification").val()
    };
    var ball = {"basicInfo": basicInfo, "formInfo": formInfo, "ClassCode": headerClassData.AccessCode};

    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/RecordEngagementForm.php",
        'data': ball,
        'success': function (data) {
            if (data.substring(0, 7) == "SUCCESS") {
                prompt("Saved!");
                checkSubmission();
            } else {
                var w = window.open();
                $(w.document.body).html(data);
            }
            wait = false;
        }
    });
}