function bootup() {
    getHeader();
    applyClassData();
    updateField();
}

function applyClassData() {
    $("#Location").val(headerClassData.Location);
    $("#Description").val(headerClassData.Description);
    $("#OHTime").val(headerClassData.OHTime);
    $("#CourseNotes").val(headerClassData.CourseNotes);
    $("#DescriptionAssignment").val(headerClassData.DescriptionAssignment);
    $("#InstructorBio").val(headerClassData.InstructorBio);
    $("#EvalInfo").val(headerClassData.EvalInfo);
}

var wait = false;

function sendToServer() {
    console.log("saving Course Basics");
    var ball = {
        "ClassCode": classCode,
        "Location": $("#Location").val(),
        "Description": $("#Description").val(),
        OHTime: $("#OHTime").val(),
        CourseNotes: $("#CourseNotes").val(),
        DescriptionAssignment: $("#DescriptionAssignment").val(),
        InstructorBio: $("#InstructorBio").val(),
        EvalInfo: $("#EvalInfo").val()
    };
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/RecordBasics.php",
        'data': ball,
        'success': function (data) {
            if (data.substring(0, 7) == "SUCCESS") {
                prompt("Course Information Saved!");
            } else {
                var w = window.open();
                $(w.document.body).html(data);
            }
            wait = false;
        }
    });
}