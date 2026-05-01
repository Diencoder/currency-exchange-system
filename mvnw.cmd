@echo off
setlocal

set "DIRNAME=%~dp0"
@REM Xóa dấu xuyệt ngược ở cuối nếu có
if "%DIRNAME:~-1%"=="\" set "DIRNAME=%DIRNAME:~0,-1%"

set "MAVEN_PROJECTBASEDIR=%DIRNAME%"
set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set "WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain"

if not "%JAVA_HOME%" == "" (
  set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
) else (
  set "JAVA_EXE=java"
)

"%JAVA_EXE%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" -classpath "%WRAPPER_JAR%" %WRAPPER_LAUNCHER% %*

endlocal
