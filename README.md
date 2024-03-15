# petaN EC Admin Console

## How to run admin console locally
此文档以 http://137.175.33.24:9000 作为后端服务，说明如何在本地启动admin console。
1. 编辑你本地的 hosts文件（Linux: /etc/hosts; Windows: C:\windows\system32\drivers\etc\hosts）添加如下两行：

```ini
137.175.33.24   ec-store.raksmart.com
127.0.0.1       ec-admin.raksmart.com
```
2. 设置环境变量：
```shell
PETAN_EC_BACKEND_URL=http://ec-store.raksmart.com:9000
```
3. 启动服务：

```shell
npm run dev
```

4. 访问服务：
- 打开浏览器访问：http://ec-admin.raksmart.com:7001
- 用户名：admin@raksmart.com
- 口令：Passw0rd