// 解决管理员权限问题

// 添加管理员权限
// 1、在[Setup]节点添加 PrivilegesRequired=admin
// 2、进入inno安装目录，找到文件SetupLdr.e32，这是一个二进制配置文件，需要用到ResHacker.exe这个工具修改
// 找到<requestedExecutionLevel level="asInvoker" uiAccess="false"/></requestedPrivileges>，
// 修改为<requestedExecutionLevel level="requireAdministrator" uiAccess="false"/></requestedPrivileges>
// 3、找到打包之前的运行文件(e.m. 快乐码字.exe),用到ResHacker.exe这个工具修改（非常重要）
// 找到<requestedExecutionLevel level="asInvoker" uiAccess="false"/></requestedPrivileges>，
// 修改为<requestedExecutionLevel level="requireAdministrator" uiAccess="false"/></requestedPrivileges>

// 删除管理员权限(这个没有试过)
// 1、在[Setup]节点添加 PrivilegesRequired=none 或者 PrivilegesRequired=lowest
// 2、在[Setup]节点修改 DefaultDirName（安装路径）的值，默认可能是DefaultDirName={pf}\{#MyAppName}，
// 不要带{pf}, {win}, {sys}这些变量值，比如设置成DefaultDirName={localappdata}\{#MyAppName}


// 解决win7无法生成桌面快捷方式
//在[Tasks]下面找到:
//Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 0,6.1
//修改为
//Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkablealone; OnlyBelowVersion: 0,8.1


//[Setup]: DefaultDirName
// 这是个必需的关键字，该值是默认的目录名称，用于“选择目录页”向导。通常它有一个目录常量前缀。
// 如果 UsePreviousAppDir 是 yes （默认值）并且安装程序发现已经安装了一个相同应用程序的早期版本，它将用先前选择的目录代替默认的目录名称。 将UsePreviousAppDir设置为no，再次安装时不会查询注册表，可重新选择安装路径。
