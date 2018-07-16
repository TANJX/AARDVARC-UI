const dialog = new mdc.dialog.MDCDialog(document.querySelector('#my-mdc-dialog'));

dialog.listen('MDCDialog:accept', function () {
    sendIfCopyDesired(true);
    console.log('accepted');
});

dialog.listen('MDCDialog:cancel', function () {
    sendIfCopyDesired(false);
    console.log('canceled');
});

function askIfCopy() {
    if (headerClassData.AskCopy == 'Yes') {
        // var shouldCopy = confirm("This course existed in a previous term.\nWould you like to import that data?\nSelect OK to import from prior term\nSelect Cancel to have a \'blank slate\'");
        // sendIfCopyDesired(shouldCopy);
        dialog.show();
    }
}

function sendIfCopyDesired(doCopy) {
    var doCopyMessage = "No";
    if (doCopy)
        doCopyMessage = "Yes"
    var ball = {
        ClassCode: headerClassData.AccessCode,
        Mode: "COPY",
        PriorCourse: headerClassData.PriorCourse,
        doCopy: doCopyMessage
    };
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/RecordCourse.php",
        'data': ball,
        'success': function (data) {
            if (data.substring(0, 7) == "SUCCESS") {
                if (doCopy)
                    warn("Course successfully copied");
                else
                    warn("Course will not be copied");
            }
            else {
                var w = window.open();
                $(w.document.body).html(data);
            }

        }
    });
}

function pdfExists() {
    var ball =
        {AccessCode: headerClassData.AccessCode};
    //alert(JSON.stringify(meetingTimes));
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/DraftPDFExists.php",
        'data': ball,
        'success': function (data) {
            var PDFPaths = JSON.parse(data);
            if (PDFPaths.Status == "EXISTS") {
                if (PDFPaths.Submitted != "") {
                    $("#ViewDraft").text("View submitted PDF");
                    $("#ViewDraft").attr("onclick", "window.open('" + PDFPaths.Submitted + "', '_blank')");
                    $("#ViewDraft").show();
                }
                else if (PDFPaths.Draft != "") {
                    $("#ViewDraft").text("View PDF Draft");
                    $("#ViewDraft").attr("onclick", "window.open('" + PDFPaths.Draft + "', '_blank')");
                    $("#ViewDraft").show();
                }
            }
        }
    });
}