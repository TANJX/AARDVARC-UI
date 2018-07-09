function bootup() {
    getHeader();
    load();
}

var wait = false;
items = [];

function getTotal() {
    var total = 0.0;
    for (var i in items) {
        total += items[i].points;
    }
    return total;
}

function calcPercents() {
    var total = getTotal();
    $("#PercTotal").text(total + "% Total");
}

function makeAddItem(i) {
    var $ret = $("<div class='grade-entry-add'></div>");
    var $pic = $("<button type='button' class='mdc-icon-button material-icons'>" +
        "<i class='material-icons'>add</i>" +
        "</button>");
    $ret.append($pic);
    $pic.click(function () {
        var newObj = {
            name: "",
            points: 0
        };
        if (i == items.length) {
            items.push(newObj);
        } else {
            newItems = [];
            for (var j in items) {
                if (j == i) newItems.push(newObj);
                newItems.push(items[j]);
            }
            items = newItems;
        }
        dispAssignments();
    });
    return $ret;
}

function cleanItems() {
    var newItems = [];
    for (var i in items) {
        if (items[i] != null)
            newItems.push(items[i]);
    }
    items = newItems;
    for (var i in items) {
        if (items[i] != null)
            items[i].index = i;
    }
}

function makeInputItem(i) {
    var $ret = $("<div class='grade-entry'></div>");

    $ret.append("<label>Assignment</label>");
    var $aName = $("<input type='text'>");
    $aName.val(items[i].name);
    $aName.change(function () {
        items[i].name = this.value;
    });
    $ret.append($aName);

    $ret.append("<label>Percent</label>");
    var $aPoints = $("<input type='text' value='" + items[i].points + "'>");
    $aPoints.change(function () {
        items[i].points = parseFloat(this.value);
        calcPercents();
        dispAssignments();
    });
    $ret.append($aPoints);
    var $pic = $("<button type='button' class='mdc-icon-button material-icons'>" +
        "<i class='material-icons delete-btn'>delete</i>" +
        "</button>");
    $pic.click(function () {
        items[i] = null;
        cleanItems();
        calcPercents();
        dispAssignments();
    });
    $ret.append($pic);
    return $ret;
}

function dispAssignments() {
    var $top = $("#Assign");
    $top.html("<div id='Assign'></div>");
    for (var i in items) {
        $top.append(makeAddItem(i));
        $top.append(makeInputItem(i));
    }
    $top.append(makeAddItem(items.length));
}

function send() {
    if (getTotal() < 100.0) {
        alert("Warning: Less than 100% credit has been entered");
    }
    var ball = {
        "ClassCode": classCode,
        "Assignments": items
    };
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/RecordAssignment.php",
        'data': ball,
        'success': function (data) {
            if (data.substring(0, 7) == "SUCCESS") {
                alert("Data successfully sent to database");
            } else {
                var w = window.open();
                $(w.document.body).html(data);
            }
            wait = false;
        }
    });
}

function load() {
    $.ajax({
        'async': true,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/EncodeAssignment.php",
        'data': {"ClassCode": classCode},
        'success': function (ball) {
            //alert(ball);
            var jason = JSON.parse(ball);
            for (var i in jason) {
                var line = jason[i];
                var newObj = {
                    name: line.Name,
                    points: parseInt(line.Points),
                    percent: 0
                };
                items.push(newObj);
            }
            calcPercents();
            dispAssignments();
        }
    });
}

$("#SendToServer").click(function () {
    send();
});
$("#SendBack").click(function () {
    wait = true;
    send();
    while (wait) {
    }
    goPage("Portal");
});
$("#SendNext").click(function () {
    wait = true;
    send();
    while (wait) {
    }
    goPage("ExamReturn");
});
$("#Back").click(function () {
    goPage("Portal");
});