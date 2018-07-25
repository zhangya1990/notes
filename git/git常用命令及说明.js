//git remote -v  查看远程仓库
//git remote add originName url  添加远程主机
//git remote rename oldName newName  修改远程主机名
//git remote rm originName  删除远程主机

//git branch 查看当前分支
//git branch branchName 创建分支
//git checkout -b branchName  创建并切换到branchName分支
//git checkout branchName  切换分支
//git branch -d branchName 删除branchName分支
//git branch -D branchName 强行删除branchName分支
//git push origin --delete branchName 删除远程分支
//git checkout -b dev origin/dev 在本地创建远程分支
//git branch --set-upstream dev origin/dev 指定本地dev和origin/dev的连接
//git branch --set-upstream-to dev origin/dev 指定本地dev和origin/dev的连接
//git branch --track dev origin/dev 指定本地dev和origin/dev的连接

//git merge branchName  将branchName分支合并到当前分支
//git log --graph 查看分支合并图
//通常，合并分支时，如果可能，Git会用Fast forward模式，但这种模式下，删除分支后，会丢掉分支信息。
//如果要强制禁用Fast forward模式，Git就会在merge时生成一个新的commit，这样，从分支历史上就可以看出分支信息,--no-ff参数，表示禁用Fast forward
//git merge branchName --no-off -m "merge with no-off"

//git checkout -- file    把file 文件在工作区的修改全部撤销，这里有两种情况：
//一种是readme.txt自修改后还没有被放到暂存区，现在，撤销修改就回到和版本库一模一样的状态；
//一种是readme.txt已经添加到暂存区后，又作了修改，现在，撤销修改就回到添加到暂存区后的状态 ,此时可以使用命令git reset HEAD file撤销暂存区操作，再次使用git checkout -- file,回到和版本库一样的状态

//git reset HEAD^ --hard 回退到上一个版本
//git log可以查看提交历史，以便确定要回退到哪个版本。
//git reflog查看命令历史，以便确定要回到未来的哪个版本。
//在Git中，用HEAD表示当前版本，也就是最新的提交，上一个版本就是HEAD^，上上一个版本就是HEAD^^，当然往上100个版本写100个^比较容易数不过来，所以写成HEAD~100。

//git stash 把当前工作现场存储起来，恢复后继续工作
//git stash list 查看之前存储过的工作内容列表
//git stash apply 恢复，但是恢复后，stash内容并不删除
//git stash drop 删除之前stash的内容；
//git stash pop，恢复的同时把stash内容也删了：

//git tag tagName 打一个标签
//git tag tagName commitId  对相应commitId的提交打一个标签
//git tag  查看所有标签
//git show tagName 查看标签信息
//创建带有说明的标签，用-a指定标签名，-m指定说明文字：
//git tag -a v0.1 -m "version 0.1 released" 3628164
//git tag -d tagName 删除标签
//git push origin tagName 推送某个标签到远程
//git push origin --tags 一次性推送全部尚未推送到远程的本地标签
//git push origin :refs/tags/tagName  删除远程标签