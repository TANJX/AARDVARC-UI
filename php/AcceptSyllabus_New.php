<?php
include ("../Server/MySqlDef.php");
include ("../Resources/CommonFunctions.php");
$from = $_POST["Path"];
$stamp = formatTimestampDash(getNow());
$folderPath = $_POST["Sem"]."/SubmittedSyllabi/";
if (!file_exists($folderPath)) mkdir($folderPath);

$finalPath = $folderPath.$_POST["ID"];
$finalName = $finalPath."_".$stamp;
$extension = ["docx","pdf"];
foreach($extension as $ext){
    copy($from.".".$ext,$finalName.".".$ext);
}

$sql = "INSERT INTO pdf (AccessCode,Path,Timestamp) VALUES ('{$_POST["Code"]}','{$finalPath}',now()) ON DUPLICATE KEY UPDATE Path = '{$finalPath}', Timestamp = now();";
$SQLDB->query($sql);
echo "<p>Submitted</p>"
//echo "<a href='{$finalName}.pdf'>Download Submitted PDF</a><br>";
//echo "<a href='http://pharmacysyllabus.usc.edu/Syllabus/Coord/Portal.html?ClassCode={$_POST["Code"]}'>Go back to course portal</a>";
?>
