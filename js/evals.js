var allIns = [];

function getInstructors() {
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/EncodeInstructorHoursForCourse.php",
        'data': {"ClassCode": headerClassData.AccessCode},
        'success': function (ball) {
            //alert(ball);
            allIns = JSON.parse(ball);
            for (var i in allIns) {
                var ins = allIns[i];
                ins.Hours = ins.Hours.toFixed(2);
                if (ins.NeedsEval == "Default") {
                    if ((ins.Hours >= 4) || (ins.Principal == "Coord"))
                        ins.NeedsEval = "Yes";
                    else
                        ins.NeedsEval = "No";
                }
            }
            makeTables();
        }
    });
}

function makeTables() {
    $optTable = $("#OptionalTable");
    for (var i in allIns) {
        var ins = allIns[i];
        var isCoord = "No";
        if (ins.Principal == "Coord") isCoord = "Yes";
        var $button = $('<td></td>');
        $button.append(makeRadioButton(i));
        $line = $('<tr>' +
            '<td>' + ins.LastName + '</td>' +
            '<td>' + ins.FirstName + '</td>' +
            '<td>' + isCoord + '</td>' +
            '<td>' + ins.Hours + '</td>' +
            '<td>' + ins.Email + '</td>' +
            '</tr>');
        $line.first().last().append($button);
        $optTable.append($line);
    }
}

function getRadioValue(id) {
    var options = document.getElementById(id);
    if (options.checked) {
        return "Yes";
    }
    return "No";
}

function makeRadioButton(row) {
    var checkYes = '';
    var $box = $("<input type='checkbox' class='mdc-checkbox__native-control' id='shouldEval" + row + "'>");
    if (allIns[row].NeedsEval == "Yes") {
        $box.prop('checked', true);
    }
    var $line = $("<div class='option'></div>");
    var $form_field = $("<div class='mdc-form-field'></div>");
    var $mdc_checkbox = $("<div class='mdc-checkbox'></div>");

    $mdc_checkbox.append($box);
    $mdc_checkbox.append("<div class='mdc-checkbox__background'>" +
        "<svg class='mdc-checkbox__checkmark' viewBox='0 0 24 24'>" +
        "<path class='mdc-checkbox__checkmark-path' fill='none' d='M1.73,12.91 8.1,19.28 22.79,4.59'></path>" +
        "</svg>" +
        "<div class='mdc-checkbox__mixedmark'></div>" +
        "</div>");
    $form_field.append($mdc_checkbox);
    $form_field.append("<label for='" + row + "'>Eval</label>");
    $line.append($form_field);
    return $line;
}

function sendToServer() {
    console.log("saving Evals");
    var insStatus = [];
    for (var i in allIns) {
        var ins = allIns[i];
        var row = {LecturerID: ins.LecturerID, NeedsEval: getRadioValue("shouldEval" + i), Name: ins.FirstName};
        insStatus.push(row);
    }
    var ball = {InsData: insStatus, AccessCode: headerClassData.AccessCode};
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/RecordEval.php",
        'data': ball,
        'success': function (data) {
            if (data.substring(0, 7) == "SUCCESS") {
                prompt("Lecturers to Receive USC Course Evaluation Saved!");
            } else {
                var w = window.open();
                $(w.document.body).html(data);
            }
        }
    });
}
