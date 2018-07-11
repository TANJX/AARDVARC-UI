var dict = {};
var custom = [];
var sections;
var sendDataToURL = "../Server/RecordCheckbox.php";

function send(boxType) {
    var CRball = [];
    for (var i in custom) {
        var c = custom[i];
        if (c !== null) {
            for (var j in c) {
                response = c[j];
                if (response != null) {
                    item = {Code: sections[i].SectionCode, Value: response};
                    CRball.push(item);
                }
            }
        }
    }

    ball = {"Type": boxType, "Boxes": dict, "ClassCode": classCode, "CustomResponses": CRball};
    //alert(JSON.stringify(ball));
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

function cleanseSection(s) {
    var newS = [];
    var oldS = custom[s];
    for (var i in oldS) {
        if (oldS[i] != null) {
            newS.push(oldS[i]);
        }
    }
    if ((newS.length == 0) || (!sections[s].Exclusive))
        newS.push(null);
    custom[s] = newS;
}

function makeCustomLine(s, i) {
    var $ret = $("<div class='entry'></div>");
    if (CBtype == "LearningObjectives") {
        var $entry = $("<textarea rows='2' cols='100'></textarea>");
    } else {
        var $entry = $("<input type='text' size='50'>");
    }
    $entry.val(custom[s][i]);
    $entry.change(function () {
        custom[s][i] = this.value;
    });
    if (!sections[s].Exclusive) {
        var $pic = $("<button type='button' class='mdc-icon-button material-icons delete-btn'>" +
            "<i class='material-icons'>delete</i>" +
            "</button>");
    } else {
        var $pic = $("<input type='checkbox'>");
        $pic.prop('checked', 'true');
    }
    $pic.click(function () {
        custom[s][i] = null;
        cleanseSection(s);
        refreshInterface();
    });
    $ret.append($pic);
    $ret.append($entry);
    return $ret;
}

function makeAddCustom(s, i) {
    var $line = $("<button type='button' class='mdc-icon-button material-icons'>" +
        "<i class='material-icons'>add</i>" +
        "</button>");
    $line.click(function () {
        if (sections[s].Exclusive)
            clearAnswers(s);
        custom[s][i] = "";
        if (!sections[s].Exclusive)
            custom[s].push(null);
        refreshInterface();

    });
    return $line;
}

function makeCustomSec(s) {
    //alert(sections[s].Title);
    var $ret = $("<div></div>");
    for (var i in custom[s]) {
        if (custom[s][i] == null) {
            $ret.append(makeAddCustom(s, i));
        } else {
            $ret.append(makeCustomLine(s, i));
        }
    }
    return $ret;
}

function clearAnswers(s) {
    for (var i in sections[s].Options) {
        var op = sections[s].Options[i];
        dict[op.Code] = "OFF";
    }
    custom[s] = [null];

}

function makeBox(s, j) {
    var op = sections[s].Options[j];
    var $ret = $("<input type='checkbox' class='mdc-checkbox__native-control' id='" + op.Code + "'>");
    $ret.change(function () {
        if (sections[s].Exclusive) {
            clearAnswers(s);
        }
        var truth = $(this).prop("checked");
        if (truth)
            dict[op.Code] = "ON";
        else
            dict[op.Code] = "OFF";
        if (sections[s].Exclusive) {
            refreshInterface();
        }
    });
    var setting = false;
    if (op.Code in dict)
        if (dict[op.Code] == "ON")
            $ret.prop('checked', 'true');
    return $ret;
}

function initializeValues() {
    for (s in sections) {
        var sec = sections[s];
        if (sec.CustomResponse) {
            custom.push([null]);
        } else {
            custom.push(null);
        }
    }
}

function makeSection(s) {
    var sec = sections[s];
    var $ret = $("<li></li>");
    $ret.append("<h4>" + sec.Title + "</h4>");

    var $choices = $("<ul></ul>");
    for (var j in sec.Options) {
        var $line = $("<div class='option'></div>");
        var $form_field = $("<div class='mdc-form-field'></div>");
        var $mdc_checkbox = $("<div class='mdc-checkbox'></div>");
        var $box = makeBox(s, j);
        $mdc_checkbox.append($box);
        $mdc_checkbox.append("<div class='mdc-checkbox__background'>" +
            "<svg class='mdc-checkbox__checkmark' viewBox='0 0 24 24'>" +
            "<path class='mdc-checkbox__checkmark-path' fill='none' d='M1.73,12.91 8.1,19.28 22.79,4.59'></path>" +
            "</svg>" +
            "<div class='mdc-checkbox__mixedmark'></div>" +
            "</div>");
        $form_field.append($mdc_checkbox);
        $form_field.append("<label for='" + sec.Options[j].Code + "'>" + sec.Options[j].Text + "</label>");
        $line.append($form_field);
        $choices.append($line);
    }
    $ret.append($choices);
    if (sec.CustomResponse) {
        $choices.append(makeCustomSec(s));
    }
    return $ret;
}

function getList(filename) {
    var myUrl = "../Resources/" + filename;
    sections = [{"Title": "Download Fail", Options: []}];
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': myUrl,
        'data': {},
        'success': function (ball) {
            var jason = JSON.parse(ball);
            sections = jason;
        }
    });
}

function refreshInterface() {
    $("#Master").html("");
    for (var i in sections) {
        $("#Master").append(makeSection(i));
    }
    updateField();
}

function getExistingValues(boxType) {
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/EncodeCheckbox.php",
        'data': {"ClassCode": classCode, "Type": boxType},
        'success': function (ball) {
            var jason = JSON.parse(ball);
            var checks = jason.Checkbox;
            for (var i in checks) {
                box = checks[i];
                dict[box.CheckBoxCode] = box.Setting;
            }
            secCodeDict = {};
            for (var i in sections) {
                sec = sections[i];
                secCodeDict[sec.SectionCode] = i;
            }
            var cusJS = jason.Customs;
            for (var i in cusJS) {
                c = cusJS[i];
                j = secCodeDict[c.SectionCode];
                custom[j].push(c.Text);
            }
            for (var i in sections) {
                cleanseSection(i);
            }
            refreshInterface();
        }
    });
}