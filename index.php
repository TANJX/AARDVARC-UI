<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AARDVARC-MATERIAL</title>
  <link rel="stylesheet" href="lib/normalize.css">
  <!--<link rel="stylesheet" href="lib/bootstrap.min.css">-->
  <link rel="stylesheet" href="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css">
  <link rel="stylesheet" href="css/index.css">
  <link rel="stylesheet" href="css/form.css">
  <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <script src="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js"></script>
  <script src="lib/jquery-3.3.1.min.js"></script>
</head>

<body>
<div class="banner">
  <div class="banner-logo">
    <img src="img/pharmacy-title.svg">
  </div>
  <div class="banner-title">
    <h4>Course Editor <span id="SemesterTitle"></span>: <span id="CourseTitle"></span></h4>
  </div>
</div>
<div class="left-col">
  <div class="left-wrapper">
    <div class="course-info">
      <p></p>
      <p></p>
    </div>
    <footer>
      <p>USC AARDVARC ©</p>
      <p>Syllabus Generator</p>
      <p>Version: 2.0</p>
      <p>Date: July 2, 2018</p>
      <p>Author:</p>
      <p>Dab Brill, Mukesh Poptani, Mars Tan</p>
    </footer>
  </div>
  <div class="mdc-list" id="menu-links">
    <a href="#" class="mdc-list-item ripple" id="CourseBasics">Course Information</a>
    <a href="#" class="mdc-list-item ripple" id="Instructors">Course Instructors</a>
    <a href="#" class="mdc-list-item ripple" id="ProgramOutcomes">Program Outcomes</a>
    <a href="#" class="mdc-list-item ripple" id="LearningObjectives">Learning Objectives &amp; Readings</a>
    <a href="#" class="mdc-list-item ripple" id="Methods">Teaching &amp; Assessment Methods</a>
    <a href="#" class="mdc-list-item ripple" id="Grading">Grading Breakdown</a>
    <a href="#" class="mdc-list-item ripple" id="ExamReturn">Exam Return Policy</a>
    <a href="#" class="mdc-list-item ripple" id="MeetingTimes">Event Schedule</a>
    <a href="#" class="mdc-list-item ripple" id="Evals">Lecturers to Receive USC Course Evaluation</a>
    <a href="#" class="mdc-list-item ripple" id="LimitedEngagementByClass">Limited Engagement Faculty Forms</a>
    <a href="#" class="mdc-list-item ripple" id="MakeDocument">Generate Syllabus Documents</a>
  </div>

</div>

<div class="main">
  <div class="main-wrapper">
    <div id="main-form">


    </div>

    <button class="mdc-button mdc-button--raised ripple btn" type="submit" id="continue-btn">Continue</button>
  </div>
</div>

<script>
    function getGetVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) {
                console.log("code: " + pair[1]);
                return pair[1];
            }
        }
        return null;
    }

    var currentPage;
    var classCode = getGetVariable("ClassCode");
    <?php

    if (array_key_exists('page', $_REQUEST)) {
      $currentPage = $_REQUEST['page'];
    } else {
      $currentPage = 'CourseBasics';
    }
    //    $Classcode = $_REQUEST['ClassCode'];
    echo 'currentPage = "' . $currentPage . '";';
    ?>
    switchTo(currentPage);

    $("#continue-btn").click(function () {

    });

    $("#menu-links a").click(function () {
        var id = $(this).attr('id');
        $("#menu-links a").removeClass('active');
        $(this).addClass('active');
        save();
        switchTo(id);
    });

    function switchTo(page) {
        history.pushState(null, null, "index.php?page=" + page + "&ClassCode=" + classCode);
        $("#main-form").load("pages/" + page + ".htm", function (responseTxt, statusTxt, xhr) {
            if (statusTxt === "success") {
                updateField();
                currentPage = page;
            }
            if (statusTxt === "error")
                alert("Error: " + xhr.status + ": " + xhr.statusText);
        });
    }

    function save() {
        console.log("saving");
    }

    function updateField() {
        $('.ripple').each(function () {
            mdc.ripple.MDCRipple.attachTo($(this)[0]);
        });

        $('.main-wrapper .mdc-icon-button').each(function () {
            // mdc.ripple.MDCRipple.attachTo($(this)[0]);
            const iconButtonRipple = new mdc.ripple.MDCRipple($(this)[0]);
            iconButtonRipple.unbounded = true;
        });

        // const formField = new mdc.formField.MDCFormField(document.querySelector('.mdc-form-field'));
        // const checkbox = new mdc.checkbox.MDCCheckbox(document.querySelector('.mdc-checkbox'));
        // formField.input = checkbox;

    }
</script>
</body>

</html>