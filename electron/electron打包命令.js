//electron-packager ./app <name> --platform=win32 --arch=x64 --overwrite --ignore=dev-settings --prune
//electron-packager <sourcedir>  <appname>  --platform= <platform> win32,darwin --arch=all --version=0.33.7 --out=dist/ --overwrite --ignore=node_modules/electron-* --ignore=node_modules/.bin --ignore=.git --ignore=dist --prune
//prune	打包之前运行npm prune --production命令，devDependencies中的包都不会打包进去，很大程度减小包的大小。
//asar	自动运行 asar pack ，也可最后手动运行，更加可控。
//ignore	此参数指定的文件，将不会随带打包进去。
//overwrite	覆盖模式打包
// <sourcedir> 项目的位置
//<appname> 应用名
// --platform=<platform></platform>： 打包的系统(darwin、win32、linux)
// --arch=<arch></arch>： 系统位数(ia32、x64)
// --icon=<icon></icon>： 指定应用的图标(Mac 为 .icns 文件，Windows 为 .ico 或 .png)
// --out <out></out>： 指定输出的目录
// --version=<version></version>： 指定编译的 electron版本



//e.m.
// electron-packager ./Happy --out=./dist/Happy --overwrite --icon=./logo.ico --platform=win32 --arch=x64 --electronVersion=1.2.8 快乐码字
