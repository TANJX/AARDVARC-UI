<?php
require_once '../../PHPDOCX/classes/CreateDocx.inc';
include("../Server/MySqlDef.php");
define("BLACK", "000000");
define("RED", "840000");
define("fontName", "Calibri");
include("../Resources/CommonFunctions.php");
function getInstructorData($num)
{
  global $SQLDB;
  $sql = "SELECT * FROM lecturers WHERE LecturerID = '{$num}'";
  return $SQLDB->query($sql)->fetch_assoc();
}

function getCourseRow($ClassCode)
{
  global $SQLDB;
  $sql = "SELECT * FROM Class WHERE BINARY AccessCode = '{$ClassCode}'";
  return $SQLDB->query($sql)->fetch_assoc();
}

function getEngagementform($LecNum, $ClassCode)
{
  global $SQLDB;
  $sql = "SELECT * FROM engagementform WHERE BINARY AccessCode = '{$ClassCode}' AND LecturerID = '{$LecNum}';";
  return $SQLDB->query($sql)->fetch_assoc();

}

function recordFilepath($LecNum, $ClassCode, $path)
{
  global $SQLDB;
  $sql = "UPDATE engagementform SET Filepath='{$path}.docx' WHERE BINARY AccessCode = '{$ClassCode}' AND LecturerID = '{$LecNum}';";
  $outcome = $SQLDB->query($sql);
  if (!$outcome) {
    echo "<p>UPDATE engagementform FAIL</p>";
    echo $sql;
  }
}

function reformatDate($dateString)
{
  $p = explode("-", $dateString);
  return $p[1] . "/" . $p[2] . "/" . $p[0];
}

if (isset($_GET['ClassCode']) && isset($_GET['InstructorCode'])) {
  $InstructorNum = $_GET['InstructorCode'];
  $ClassCode = $_GET['ClassCode'];

} else {
  echo "<p>Instructor or Course Code Not Recieved</p>";
  exit;
}
$submissionGen = "No";
if (isset($_GET['Submit'])) {
  $submissionGen = $_GET['Submit'];
}
//$ClassCode = "DAB4PRESIDENT1234567";
$ClassData = getCourseRow($ClassCode);
$courseID = $ClassData["CourseID"];
$courseNumTitle = "{$ClassData["CourseID"]}: {$ClassData["Title"]}";
//$InstructorNum = 6;
$InstructorData = getInstructorData($InstructorNum);
$FormData = getEngagementform($InstructorNum, $ClassCode);
$StartDate = reformatDate($FormData["StartDate"]);
$EndDate = reformatDate($FormData["EndDate"]);

if ($FormData["Submitted"] == "Yes") {
  $subName = $FormData["SubmitterName"];
  $subDate = reformatDate(substr($FormData["SubmissionTimestamp"], 2, 8));
  if ($submissionGen != "Yes") {
    echo "<h1>Form Already Submitted on {$subDate}</h1>";
    exit;
  } else
    echo "<h1>Final Version of Form With Signature</h1>";
} else {
  $subName = "Course Coordinator";
  $subDate = "MM/DD/YY";
}
//$InstructorFirstInitial = $InstructorData["FirstName"][0];

$sem = getSemStr($ClassCode);
$semPath = '../Document/' . str_replace(" ", "", $sem);
if (!file_exists($semPath)) mkdir($semPath);
$leFolderPath = "{$semPath}/LEForms";
$diskPath = realpath('../Document/') . "/" . str_replace(" ", "", $sem) . "/LEForms";
if (!file_exists($leFolderPath)) mkdir($leFolderPath);

$myDoc = getTemplate('LE');

//Residency Checkbox Data
$CitizenCheckbox = "   ";
$ResidentCheckbox = "   ";
$AlienCheckbox = "   ";
$USs = $InstructorData["USStatus"];
if ($USs == "citizen") $CitizenCheckbox = " X ";
if ($USs == "resident") $ResidentCheckbox = " X ";
if ($USs == "alien") $AlienCheckbox = " X ";


$L = $InstructorData;
$simpleReplacements = array('LastName' => $L["LastName"], 'FirstName' => $L["FirstName"], 'MiddleInitial' => $L["MiddleInitial"], 'Phone' => $L["Phone"], 'Email' => $L["Email"], 'Address1' => $L["Address1"], 'Address2' => $L["Address2"], 'CityState' => $L["CityStateZip"], 'Country' => $L["Country"], 'StartDate' => $StartDate, 'EndDate' => $EndDate, 'PayAmnt' => $FormData["PaymentAmount"], 'VendorNum' => $L["VendorNum"], 'CourseNumTitle' => $courseNumTitle, 'HourCount' => $FormData["Hours"], 'SubmitSig' => $subName, 'SubmitDate' => $subDate, 'CustomJustification' => $FormData["CustomJustification"]);
$myDoc->replaceVariableByText($simpleReplacements, array('parseLineBreaks' => true, 'font' => fontName));
$myDoc->replaceVariableByText(array('A' => $CitizenCheckbox, 'B' => $ResidentCheckbox, 'C' => $AlienCheckbox), array('parseLineBreaks' => true, 'font' => fontName, 'bold' => true, 'color' => RED, 'underline' => true));

$endFilename = $courseID . "_LimitedEngagement_" . $InstructorData["FirstName"] . "." . $InstructorData["LastName"];
$outputFilename = $diskPath . "/" . $endFilename;
$linkFilename = $leFolderPath . "/" . $endFilename;
$myDoc->createDocx($outputFilename);
echo "<button type=\"button\" class=\"mdc-button mdc-button--outlined\" onclick='window.open(\"{$linkFilename}.docx\")'>Get Document File</button>";
recordFilepath($InstructorNum, $ClassCode, $linkFilename);
?>