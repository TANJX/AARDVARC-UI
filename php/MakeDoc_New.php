<?php
include("../Server/MySqlDef.php");
include("../Resources/CommonFunctions.php");
define("BLACK", "000000");
define("RED", "840000");
define("fontName", "Calibri");
function loadJSON($filename)
{
  $raw = file_get_contents($filename);
  return json_decode($raw);
}

function prepareCBDict()
{
  global $ClassCode;
  global $SQLDB;
  $sql = "SELECT CheckBoxCode,Setting FROM checkbox WHERE BINARY AccessCode = '{$ClassCode}';";
  $queryResults = $SQLDB->query($sql);
  $ret = [];
  while ($row = $queryResults->fetch_assoc()) {
    $ret[$row["CheckBoxCode"]] = $row["Setting"];
  }
  return $ret;
}

function prepareCustomResponseDict()
{
  global $ClassCode;
  global $SQLDB;
  $sql = "SELECT SectionCode,Text FROM customentry WHERE BINARY AccessCode = '{$ClassCode}';";
  $queryResults = $SQLDB->query($sql);
  $ret = [];
  while ($row = $queryResults->fetch_assoc()) {
    $sec = $row["SectionCode"];
    if (isset($ret[$sec])) {
      $ret[$sec][] = $row["Text"];
    } else {
      $ret[$sec] = [$row["Text"]];
    }
  }
  return $ret;
}

function makeCheckboxFragment($jsonFile, $CBDict, $CusResDict = null, $highlight = false)
{
  global $myDoc;
  //echo "About to load {$jsonFile}<br>";
  $jsonData = loadJSON($jsonFile);
  $ret = new WordFragment($myDoc);
  $top = [];
  foreach ($jsonData as $section) {
    $top[] = $section->Title;
    $ops = makeCheckboxSection($section, $CBDict, $CusResDict, $highlight);
    $top[] = $ops;
  }
  $ret->addList($top, 1, array('font' => fontName));
  return $ret;
}

function makeSingleCheckboxFragment($jsonFile, $CBDict, $CusResDict = null, $highlight = false, $ID = null, $fontSize = 12)
{
  global $myDoc;
  //echo "About to load {$jsonFile}<br>";
  $jsonData = loadJSON($jsonFile);
  $ret = new WordFragment($myDoc);
  $ops = null;
  if ($ID == null) {
    $jsonSeg = $jsonData["0"];
  } else {
    $jsonSeg = null;
    foreach ($jsonData as $section) {
      //var_dump($section);
      //echo $section->SectionCode."   ".$ID."<br>";
      if ($section->SectionCode == $ID) {
        //var_dump($section);
        $jsonSeg = $section;
      }
    }
  }
  $ops = makeCheckboxSection($jsonSeg, $CBDict, $CusResDict, $highlight, $fontSize);
  $ret->addList($ops, 1, array('font' => fontName, 'fontSize' => $fontSize));
  return $ret;
}

function makeCheckboxSection($section, $CBDict, $CusResDict = null, $highlight = false, $fontSize = 12)
{
  //var_dump($CusResDict);
  $ops = [];
  if (isset($section->Options)) {
    foreach ($section->Options as $box) {
      $selected = false;
      $boxcode = $box->Code;
      if (isset($CBDict[$boxcode])) {
        $selected = $CBDict[$boxcode] == "ON";
      }
      if ($highlight) {
        $color = BLACK;
        if ($selected) $color = RED;
        $lineStyle = array(
            'bold' => $selected,
            'underline' => $selected,
            'color' => $color,
            'font' => fontName,
            'fontSize' => $fontSize
        );
      } else {
        $lineStyle = ['font' => fontName,
            'fontSize' => $fontSize];
      }
      if ($highlight or $selected) {
        $line = new WordFragment($myDoc);
        $line->addText($box->Text, $lineStyle);
        $ops[] = $line;
      }
    }
  }

  if (isset($section->SectionCode)) {
    $secCode = $section->SectionCode;
    $responses = $CusResDict[$secCode];
    for ($i = 0; $i < count($responses); $i++) {
      $line = new WordFragment($myDoc);
      if ($highlight) {
        $lineStyle = array(
            'bold' => true,
            'underline' => true,
            'font' => fontName,
            'fontSize' => $fontSize
        );
      } else {
        $lineStyle = ['font' => fontName,
            'fontSize' => $fontSize];
      }
      $line->addText($responses[$i], $lineStyle);
      $ops[] = $line;
    }
  }
  return $ops;
}

function makeAssignmentTable()
{
  global $SQLDB;
  global $myDoc;
  global $ClassCode;
  $sumsql = "SELECT sum(Points) cnt FROM assignment WHERE BINARY AccessCode = '{$ClassCode}';";
  $pointsum = $SQLDB->query($sumsql)->fetch_assoc()["cnt"];
  $ret = [];

  $sql = "SELECT * FROM assignment WHERE BINARY AccessCode = '{$ClassCode}';";
  $query = $SQLDB->query($sql);
  while ($row = $query->fetch_assoc()) {
    $points = $row["Points"];
    $entry = array('Assignment' => $row["Name"], 'Points' => ($points . '%'));
    $ret[] = $entry;
  }
  if (count($ret) == 0) {
    $entry = array('Assignment' => "", 'Points' => "");
    $ret[] = $entry;
  }
  return $ret;
}

function timify($str)
{
  $ret = date("g:ia", strtotime($str));
  //if ($ret > 12) $ret-=12;
  //if ($ret == 0) $ret = 12;
  //if ($ret[0] == "0") $ret = substr($ret,1);
  return $ret;
}

function getEventLecturers($serial)
{
  global $SQLDB;
  $topsql = "SELECT * FROM event_lecturer e, lecturers l WHERE e.EventSerial = '{$serial}' AND l.LecturerID = e.LecturerID;";
  $topquery = $SQLDB->query($topsql);
  $ret = [];
  while ($row = $topquery->fetch_assoc()) $ret[] = $row;
  return $ret;
}

function getEventLecturersAsString($serial)
{
  $list = getEventLecturers($serial);
  $ret = "";
  $ret = $ret . $list[0]["LastName"];
  for ($i = 1; $i < count($list); $i++) {
    //echo "<";
    $ret = $ret . "\n" . $list[$i]["LastName"];
  }
  //echo $serial.":".$ret."<br>";
  return $ret;
}

function makeSchedule()
{
  global $SQLDB;
  global $ClassCode;
  global $myDoc;
  $sql = "SELECT * FROM Event WHERE BINARY AccessCode = '{$ClassCode}' ORDER BY Date,StartTime;";
  $ret = [];
  $query = $SQLDB->query($sql);
  while ($row = $query->fetch_assoc()) {
    $dateO = date("D M j", strtotime($row["Date"]));
    $sTimeO = timify($row["StartTime"]);
    $eTimeO = timify($row["EndTime"]);
    $timeStr = $dateO . "\n" . $sTimeO . "-" . $eTimeO;
    $lec = getEventLecturersAsString($row["EventSerial"]);
    $expanded = $row["Description"] . "\n\n" . $row["Information"];

    $entry = array('Date' => $timeStr, 'ScheduleEvent' => $row["Description"], 'ScLec' => $lec, 'ScheduleEventExpanded' => $expanded);
    $ret[] = $entry;
  }
  if (count($ret) == 0) {
    $entry = array('Date' => "", 'ScheduleEvent' => "", 'ScLec' => "");
    $ret[] = $entry;
  }
  return $ret;
}

function getCourseRow()
{
  global $SQLDB;
  global $ClassCode;
  $sql = "SELECT * FROM Class WHERE AccessCode = '{$ClassCode}'";
  return $SQLDB->query($sql)->fetch_assoc();
}

function getByline()
{
  global $SQLDB;
  global $ClassCode;
  $ret = "";
  $sql = "SELECT * FROM class_lecturer NATURAL JOIN lecturers WHERE BINARY AccessCode = '{$ClassCode}' AND Principal='Coord' ORDER BY LastName;";
  $query = $SQLDB->query($sql);
  $count = 0;
  $total = $query->num_rows;
  while ($lec = $query->fetch_assoc()) {
    if ($count > 0) {
      if ($total == 2) $ret .= " and ";
      else $ret .= ", ";
    }
    $ret .= "{$lec["FirstName"]} {$lec["LastName"]}";
    $count++;
  }
  return $ret;
}

function getCoordinators()
{
  global $SQLDB;
  global $ClassCode;
  $ret = "";
  $sql = "SELECT * FROM class_lecturer NATURAL JOIN lecturers WHERE BINARY AccessCode = '{$ClassCode}' AND Principal='Coord' ORDER BY LastName;";
  $query = $SQLDB->query($sql);
  $count = 0;
  while ($row = $query->fetch_assoc()) {
    $lec = $row;
    $line = "{$lec["FirstName"]} {$lec["LastName"]}:  {$lec["Email"]}\nOffice: {$lec["Office"]}    Phone#: {$lec["Phone"]}";
    if ($count + 1 < $query->num_rows) $line = $line . "\n\n";
    $count++;
    $ret = $ret . $line;

  }
  return $ret;
}

function getNonCoordinators()
{
  global $SQLDB;
  global $ClassCode;
  $ret = '';
  $sql = "SELECT FirstName,LastName,Email FROM class_lecturer NATURAL JOIN lecturers WHERE BINARY AccessCode = '{$ClassCode}' AND Principal='Principal' ORDER BY LastName;";
  $query = $SQLDB->query($sql);
  while ($row = $query->fetch_assoc()) {
    $line = "{$row["FirstName"]} {$row["LastName"]}: {$row["Email"]}\n";
    $ret = $ret . $line;
  }
  //echo $ret."<br>";
  return $ret;
}

function getDOW($dow)
{
  $TLC = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  $ret = "";
  $first = true;
  for ($i = 0; $i < 7; $i++) {
    if ($dow[$i] == "Y") {
      if ($first) {
        $ret = $TLC[$i];
        $first = false;
      } else {
        $ret = $ret . "," . $TLC[$i];
      }
    }
  }
  return $ret;
}

//echo "Generating Syllabus<br>";
$PHPTimestamp = time();
//$ClassCode = "DAB4PRESIDENT1234567";
$ClassCode = $_GET["ClassCode"];

//Course Attributes
$CourseData = getCourseRow();
$courseID = $CourseData["CourseID"];
$courseTitle = "{$CourseData["CourseID"]}: {$CourseData["Title"]}";
if ($CourseData["dfltStart"] != null) $modalTimeStart = date("g:ia", strtotime($CourseData["dfltStart"]));
else $modalTimeStart = "";
if ($CourseData["dfltEnd"] != null) $modalTimeEnd = date("g:ia", strtotime($CourseData["dfltEnd"]));
else $modalTimeEnd = "";
if (($modalTimeEnd == "") and ($modalTimeStart == "")) $modalTime = "";
else $modalTime = "{$modalTimeStart}-{$modalTimeEnd}";
$NumUnits = $CourseData["Units"] . " Units";
if ($CourseData["IrregularTimes"] == "NO") {
  $dowStr = getDOW($CourseData["DOW"]);
} else {
  $dowStr = "Course Days Vary";
  $modalTime = "See Notes Below";
}
$HeadLoc = $CourseData["Location"];
$Description = $CourseData["Description"];
$OHTime = $CourseData["OHTime"];
$CourseNotes = $CourseData["CourseNotes"];
$DescAssign = $CourseData["DescriptionAssignment"];
$CoordBio = $CourseData["InstructorBio"];
$EvalInfo = $CourseData["EvalInfo"];
$isAGradClass = ($CourseData["Program"] == "PhDMS");
$DateTimestamp = formatTimestampDash(getNow());
$CBDict = prepareCBDict();
$CusResDict = prepareCustomResponseDict();

require_once '../../PHPDOCX/classes/CreateDocx.inc';
$myDoc = getTemplate('Syllabus');
$myDoc->setDefaultFont(fontName);

$coordList = getCoordinators();
$principalList = getNonCoordinators();

$sem = getSemStr($ClassCode);
$semPath = '../Document/' . str_replace(" ", "", $sem);
$urlPath = $semPath . '/InProgressSyllabi';
//echo $sem . "<br>";
//echo $courseTitle . "<br>";
$diskPath = realpath('../Document/') . "/" . str_replace(" ", "", $sem) . '/InProgressSyllabi';
if (!file_exists($semPath)) mkdir($semPath);
if (!file_exists($urlPath)) mkdir($urlPath);


$byline = getByline();
$docProperties = array(
    'title' => $courseTitle . " syllabus",
    'subject' => 'Course Syllabus',
    'creator' => $byline,
    'category' => 'Syllabus',
    'Company' => 'USC School of Pharmacy'
  #'keywords' => 'keyword 1, keyword 2, keyword 3',
  #'description' => 'The description could be much longer than this',
  #'contentStatus' => 'Draft',
  #'Manager' => 'The boss'
);
$myDoc->addProperties($docProperties);


$myDoc->enableCompatibilityMode();
if ($isAGradClass) {
  $ProgOutcome = new WordFragment($myDoc);
} else {
  $ProgOutcome = makeCheckboxFragment("../Resources/ProgramOutcomes.json", $CBDict, $CusResDict, true);
}
$Methods = makeCheckboxFragment("../Resources/Methods.json", $CBDict, $CusResDict, false);
$ExamReturn = makeSingleCheckboxFragment("../Resources/ExamReturn.json", $CBDict, $CusResDict, false, null, 10);
$LearnObjective = makeSingleCheckboxFragment("../Resources/LearningObjectives.json", $CBDict, $CusResDict, false, "J");
$RequiredReading = makeSingleCheckboxFragment("../Resources/LearningObjectives.json", $CBDict, $CusResDict, false, "K");

$GradedAssignments = makeAssignmentTable($ClassCode);
$myDoc->replaceTableVariable($GradedAssignments, array('parseLineBreaks' => true, 'font' => fontName));

$schedule = makeSchedule();
$myDoc->replaceTableVariable($schedule, array('parseLineBreaks' => true, 'font' => fontName));

$variables = array('ProgOutcomeList' => $ProgOutcome, 'MethodList' => $Methods, 'LearningOutcomeList' => $LearnObjective, 'RequiredReadings' => $RequiredReading, 'ExamReturnList' => $ExamReturn);
$myDoc->replaceVariableByWordFragment($variables, array('parseLineBreaks' => true, 'font' => fontName));


$simpleReplacements = array('HeadTitle' => $courseTitle, 'SemesterTitle' => $sem, 'HeadTime' => $modalTime, 'PrincipalFaculty' => $principalList, 'CoordFaculty' => $coordList, 'NumUnits' => $NumUnits, 'DOW' => $dowStr, 'Location' => $HeadLoc, 'CourseDescription' => $Description, 'OfficeHours' => $OHTime, 'CourseNotes' => $CourseNotes, 'DescriptionAssignment' => $DescAssign, 'CoordBio' => $CoordBio, 'EvalInfo' => $EvalInfo);
$myDoc->replaceVariableByText($simpleReplacements, array('parseLineBreaks' => true, 'font' => fontName));
$myDoc->replaceVariableByText(array('CourseID' => $courseID, 'GenDate' => $DateTimestamp), array('parseLineBreaks' => true, 'target' => 'footer', 'font' => fontName));

$outputFilename = $diskPath . "/" . $courseID;
$myDoc->createDocx($outputFilename);
$myDoc->transformDocxUsingMSWord($outputFilename . '.docx', $outputFilename . '.pdf');
$linkFilename = $urlPath . "/" . $courseID;
//echo "<p>Done</p>";
//echo "<a href='{$linkFilename}.docx'>Get Document File</a><br>";

echo "<div class='buttons'>";
echo "<button type=\"button\" class=\"mdc-button mdc-button--outlined\" onclick='window.open(\"{$linkFilename}.pdf?Timestamp={$PHPTimestamp}\")'>Get PDF File</button>";
//echo "<button id = 'BackButton' onclick = 'goBack(\"" . $ClassCode . "\")'>Go back without submitting</button><br>";
echo "<button type=\"button\" class=\"mdc-button mdc-button--outlined\" id = 'AcceptButton' onclick = 'redirectToAcceptance(\"" . $ClassCode . "\",\"" . $linkFilename . "\",\"" . $semPath . "\",\"" . $courseID . "\")'>Accept Syllabus</button>";
echo "</div>";
echo "<p>You can update later after accepting the syllabus</p>";
