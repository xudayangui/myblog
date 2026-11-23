---
title: Git 高频但容易忘的实用技巧
date: 2024-06-28
tags:
 - Git
 - 开发工具
categories:
 - 开发工具
---

Git 每天用，但很多强大命令平时想不起来。这里整理一些真正高频实用的技巧。

## 撤销与回退

```bash
# 撤销工作区的修改（还没 add）
git checkout -- file.txt
# 新版推荐
git restore file.txt

# 撤销 add（已经 add 但没 commit）
git reset HEAD file.txt
# 新版推荐
git restore --staged file.txt

# 修改最后一次 commit（文案写错、漏了文件）
git commit --amend --no-edit  # 不改文案
git commit --amend -m "new message"  # 改文案

# 回退到某个版本（保留工作区）
git reset --soft HEAD~1
# 完全回退（危险，会丢工作区修改）
git reset --hard HEAD~1
```

## 找回丢失的提交

`reflog` 是 Git 的「后悔药」，记录了所有 HEAD 的移动：

```bash
git reflog
# 找到误操作的 commit hash
git reset --hard <hash>
```

只要没被垃圾回收，删掉的分支、reset 掉的提交都能找回来。

## 暂存未完成的工作

写到一半要切分支处理紧急 bug：

```bash
git stash              # 暂存当前修改
git stash push -m "wip: 用户登录"  # 带说明
git stash list         # 查看暂存列表
git stash pop          # 恢复最近一次暂存
git stash apply stash@{1}  # 恢复指定的
```

## 挑拣提交

想把另一个分支的某个 commit 拿过来，不要合并整个分支：

```bash
git cherry-pick <commit-hash>
```

## 交互式 rebase：整理提交历史

```bash
git rebase -i HEAD~3
```

可以合并（squash）、重排、删除提交。把多个零碎的「fix」「wip」合并成一个干净的提交，代码评审会更友好。

## 搜索与排查

```bash
# 搜索提交信息
git log --grep="修复登录"

# 搜索代码内容的变更历史
git log -S "someFunction" --oneline

# 查看某行代码是谁在什么时候改的
git blame file.js

# 查看两个分支的差异
git diff main..feature
```

## 实用配置

```bash
# 配置常用别名
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.lg "log --oneline --graph --decorate --all"

# 自动修正命令拼写
git config --global help.autocorrect 1
```

## 小结

Git 的强大在于它的「一切皆可恢复」——只要理解 commit、暂存区、工作区三层结构，`reflog` + `reset` + `revert` 能救回绝大多数误操作。不确定时先 `git status` 看清楚状态再动手。
