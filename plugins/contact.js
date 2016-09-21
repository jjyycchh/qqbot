/**
 * Created by jjyyc on 2016/9/19.
 */

/**
 * 群组联系人管理列表
 * 1. 分群管理权限确定是否回复
 * 2. 根据群员列表判定是否可查
 * 3. 根据本人回复判定是否修改其号码
 * 4. 同群成员互相查询号码
 * 5. 批量输出当前群组成员的号码为csv格式文本
 */

(function() {
    var version = "v0.1alpha";
    var OpType = {
        Insert: "insert",
        Update: "update",
        Select: "select",
        Delete: "delete",
        List: "list"
    };
    var client = require('../src/httpclient');
    module.exports = function(content, send, robot, message) {
        if (!message){
            return "";
        }
        //if (!message.type || message.type != "group_message"){
        if (!message.type || (message.type != "group_message" && message.type != "discu_message")){
            return "";//必须是群内消息
        }
        if (!message.is_at_me || !message.is_at_me){
            return "";//必须at我 才能工作
        }
        if (!message.ori_content){
            return "";
        }

        content = content.trim();
        var target_help = /^contact help$/i;
        if (content.match(target_help)){
            //显示帮助文档
            send("联系人插件 " + version + " 帮助\n" +
                "使用该插件进行手机号查询吧（所有指令都要at我哦~）！\n" +
                "目前只能查询当前 群 or 讨论组 内成员的手机号哦\n" +
                "---------------------------------------------------\n" +
                "1. 增加/修改联系人号码（号码支持3~8位或11位纯数字），" +
                "发送如下指令：\n" +
                "新增我的信息：姓名|号码\n" +
                " 或\n" +
                "更新我的号码：姓名|号码\n" +
                "2. 查询联系人号码，发送如下指令：\n" +
                "查询XXX的手机号\n" +
                " 或\n" +
                "查询XXX的号码\n" +
                "3. 删除自己的信息，发送如下指令：\n" +
                "删除我的信息\n" +
                " 或\n" +
                "删除我的号码\n" +
                "--------------------谢谢您的使用-------------------");
            return "";
        }

        var target_insert = /^(?:新增|添加)我的(?:信息|号码)：(.+)?\|([\d]{11}|[\d]{3,8})$/i;
        var target_update = /^(?:更新|修改)我的(?:信息|号码)：(.+)?\|([\d]{11}|[\d]{3,8})$/i;
        var target_select = /^查询(.+)?的(手机号|号码|信息)$/i;
        var target_delete = /^删除我的(?:信息|号码)$/i;

        var op = "", s_uin = message.from_uin, t_uin = "", t_name = "", t_caller = "";

        var ret = content.match(target_insert);
        if (ret){
            op = OpType.Insert;
            t_uin = s_uin;
            t_name = ret[1];
            t_caller = ret[2];
            if (!have_right(s_uin, op, t_uin, robot, message)){
                send("没有权限进行该操作："+op);
                return "";
            }
            client.request({
                url: encodeURI("http://localhost/api/" + t_uin + "/" + t_name + "/" + t_caller),
                port: 3000,
                method: "POST"
            },{}, function(data, err){
                console.log(JSON.stringify(data));
                console.error(JSON.stringify(err));
                if (typeof data.code != "undefined" && data.code == 0){
                    //成功
                    send(op + "操作成功！");
                }else{
                    send(op + "操作失败！\n" + JSON.stringify(data));
                }
                //send(JSON.stringify(data));
                //send("进入了联系人操作插件\n 由'" + message.from_user.nick + "'发起的'" + op + "'操作，参数为" + JSON.stringify(ret.slice(1)));
            });
            return "";
        }

        ret = content.match(target_update);
        if (ret){
            op = OpType.Update;
            t_uin = s_uin;
            t_name = ret[1];
            t_caller = ret[2];
            if (!have_right(s_uin, op, t_uin, robot, message)){
                send("没有权限进行该操作："+op);
                return "";
            }
            client.request({
                url: encodeURI("http://localhost/api/" + t_uin + "/" + t_name + "/" + t_caller),
                port: 3000,
                method: "POST"
            },{}, function(data, err){
                console.log(JSON.stringify(data));
                console.error(JSON.stringify(err));
                if (typeof data.code != "undefined" && data.code == 0){
                    //成功
                    send(op + "操作成功！");
                }else{
                    send(op + "操作失败！\n" + JSON.stringify(data));
                }
                //send(JSON.stringify(data));
                //send("进入了联系人操作插件\n 由'" + message.from_user.nick + "'发起的'" + op + "'操作，参数为" + JSON.stringify(ret.slice(1)));
            });
            return "";
        }

        ret = content.match(target_select);
        if (ret){
            op = OpType.Select;
            //t_uin = "";
            t_name = ret[1];
            //t_caller = "";
            client.request({
                url: encodeURI("http://localhost/api/" + t_name),
                port: 3000,
                method: "GET"
            },{}, function(data, err){
                console.log(JSON.stringify(data));
                console.error(JSON.stringify(err));
                if (typeof data.code != "undefined" && data.code == 0){
                    //成功
                    if (data.result){
                        if (have_right(s_uin, op, data.result, robot, message)){
                            t_uin = decodeURI(data.result.uin);
                            t_name = decodeURI(data.result.name);
                            t_caller = decodeURI(data.result.number);
                            send(t_name + "的手机号为：" + t_caller);
                        }else{
                            send("臣妾查不到啊！");
                        }
                    }else{
                        send("臣妾查不到啊~~");
                    }
                }else{
                    //有错误
                    send("臣妾查不到啊~");
                    //send(JSON.stringify(err) + "\n" + JSON.stringify(data));
                }
                //send("进入了联系人操作插件\n 由'" + message.from_user.nick + "'发起的'" + op + "'操作，参数为" + JSON.stringify(ret.slice(1)));
            });
            return "";
        }

        ret = content.match(target_delete);
        if (ret){
            op = OpType.Delete;
            t_uin = s_uin;
            //t_name = "";
            //t_caller = "";
            if (!have_right(s_uin, op, t_uin, robot, message)){
                send("没有权限进行该操作："+op);
                return "";
            }
            client.request({
                url: encodeURI("http://localhost/api/" + t_uin),
                port: 3000,
                method: "DELETE"
            },{}, function(data, err){
                console.log(JSON.stringify(data));
                console.error(JSON.stringify(err));
                if (typeof data.code != "undefined" && data.code == 0){
                    //成功
                    send(op + "操作成功！");
                }else{
                    send(op + "操作失败！\n" + JSON.stringify(data));
                }
                //send(JSON.stringify(data));
                //send("进入了联系人操作插件\n 由'" + message.from_user.nick + "'发起的'" + op + "'操作，参数为" + JSON.stringify(ret.slice(1)));
            });
            return "";
        }
        return "";
        //send("进入了联系人操作插件\n 由'" + message.from_user.nick + "'发起的'" + op + "'操作，参数为[" + target_uins.join("") + "]");
    };

    var have_admin_right = function(uin, op, t_uins, gid, robot){
        //检查是否有管理权限
        return !!(Number(uin) == 2691159519 ||
        (t_uins != null && t_uins.length > 0 && (t_uins instanceof Array) && t_uins.filter(function (u) {
            return u != uin
        }).length > 0)); //是否为管理员 或 （t_uins不为空且其中和主人uin不相同的内容量为0）
    };

    var have_right = function(uin, op, t_user, robot, message){
        if (!uin || !t_user || !robot || !message){
            return false;
        }
        switch (op){
            case OpType.Insert:
            case OpType.Delete:
            case OpType.Update:
                return have_admin_right(uin, op, [t_user.uin], message.from_gid || message.from_did, robot);
            case OpType.Select:
                var t_uin = t_user.uin;
                var h_temp_user = null;
                if (message.from_gid){
                    h_temp_user = robot.get_user_ingroup(Number(t_uin), message.from_gid);
                    return (h_temp_user != null);
                }else if (message.from_did){
                    h_temp_user = robot.get_user_in_dgroup(Number(t_uin), message.from_did);
                    return (h_temp_user != null);
                }else{
                    return false;
                }
            default:
                return false;
        }
    };

}).call(this);