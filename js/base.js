
;(function () {
    'use strict';
    var $form_add_task = $('.add-task')
        , task_list = []
        ,$delete_task_trigger
        ,$detail_task_trigger
        ,$task_detail=$('.task-detail')
        ,$task_detail_mask=$('.task-detail-mask')
        ,current_index
        ,$update_form
        ,$task_detail_content
        ,$task_detail_content_input
        ,$checkbox_complete
        ,$msg = $('.msg')
        , $msg_content = $msg.find('.msg-content')
        , $msg_confirm = $msg.find('.confirmed')
        , $alerter = $('.alerter')
        , $window = $(window)
        , $body = $('body')
        ;
    init();
    $task_detail_mask.on('click',hide_task_detail)
    $form_add_task.on('submit', function (e) {
       var new_task = {};
        //禁用默认行为
        e.preventDefault();
        //获取新task的值
        var $input=$(this).find('input[type=text]');
        new_task.content =  $input.val();
        //若task值为空。则返回
        if (!new_task.content) return;
        //存入新task
      if(add_task(new_task)){
          //render_task_list();
          $input.val(null);
      }
    })
    //查找并监听所有删除按钮的点击事件
    function  listen_task_delete(){
        $delete_task_trigger.on('click',function(){
            var $this=$(this);
            var $it=$this.parent();
            var $item=$it.parent();
            var index=$item.data('index');
            new_alert('确定删除？').then(function (r) {
                r?delete_task(index):null;
            })
        })
    }
    //监听打开task详情事件
    function listen_task_detail(){
     var index;
     $('.task-item').on('dblclick', function () {
         index=$(this).data('index');
         show_task_detail(index);
     })
     $detail_task_trigger.on('click', function () {
         var $this=$(this);
         var $it= $this.parent()
         var $item=$it.parent();
          index=$item.data('index');
         show_task_detail(index);
     })
 }
    //监听任务状态
   function  listen_checkbox_complete(){
       $checkbox_complete.on('click', function () {
           var $this=$(this);
           var index=$this.parent().parent().data('index');
           var item=store.get('task_list')[index];
           if(item.complete)
           update_task(index,{complete:false});
           else
           update_task(index,{complete:true});
       })
   }
    //点击详情，查看task详情
   function show_task_detail(index){
    //生成详情模板
    render_task_detail(index);
    current_index=index;
    $task_detail.show();
    $task_detail_mask.show();
}
    //更新task
    function  update_task(index,data){
        if(!index||!task_list[index])
        return;
        task_list[index]= $.extend({},task_list[index],data);
        refresh_task_list();
    }
    //隐藏task详情
    function hide_task_detail(){
        $task_detail.hide();
        $task_detail_mask.hide();
    }
    //task的详细信息
    function render_task_detail(index){
        if(index===undefined||!task_list[index]) return;
        var item=task_list[index];
        var tpl='<form>'+
            '<div class="content">'+item.content+'</div>'+
            '<div class="input-item">'+
            '<input style="display: none" type="text" name="content" autofocus value="'+(item.content || '')+'">'+
            '</div>'+
            '<div>'+
            '<div class="desc  input-item">'+
            '<textarea name="desc" >'+(item.desc || '')+'</textarea>'+
            '</div>'+
            '</div>'+
            '<div class="remind input-item">'+
                '<label>提醒时间:</label>'+
            '<input class="datetime"  style="margin-top: 10px;" name="remind_date"  type="text" value="'+(item.remind_date || '')+'">'+
            '</div>'+
            '<div class="input-item"><button type="submit">更新</button></div>'
            '</form>';
        //清空task详情模板。后添加新模板
        $task_detail.html(null);
        $task_detail.html(tpl);
        $('.datetime').datetimepicker();
        $update_form=$task_detail.find('form');
        $task_detail_content=$update_form.find('.content');
        $task_detail_content_input=$update_form.find('[name=content]');

        $task_detail_content.on('dblclick',function(){
            $task_detail_content_input.show();
            $task_detail_content.hide();
        })
        $update_form.on('submit', function (e) {

            e.preventDefault();//取消默认行为，不然表单直接提交
            var data={};
            data.content=$(this).find('[name=content]').val();
            data.desc=$(this).find('[name=desc]').val();
            data.remind_date=$(this).find('[name=remind_date]').val();
            update_task(index,data);
            hide_task_detail();
        })
    }


    function add_task(new_task) {
        task_list.push(new_task);
        //更新localStorage
        refresh_task_list();
        return true;
    }
    //刷新localstorage并更新列表
    function refresh_task_list(){
        store.set('task_list', task_list);
        render_task_list();
    }
    //删除一条task
    function delete_task(index){
        if(index===undefined||!task_list[index]) return;
        delete task_list[index];
        refresh_task_list();
    }
    //初始化
    function init() {
        //store.clear();
        task_list = store.get('task_list') || [];
        listen_msg_event();
        if(task_list.length)
            render_task_list();
        task_remind_check();

    }
    //渲染全部task'模板
    function render_task_list() {
        var $task_list=$('.task-list');
        $task_list.html('');
        var complete_items=[];
        for(var i=0;i<task_list.length;i++){
            var item=task_list[i];
            if(item && item.complete)
            complete_items[i]=item;
            else
            var $task=render_task_tpl(item,i);
            $task_list.prepend($task);

        }
        for(var j=0;j<complete_items.length;j++){
             $task=render_task_tpl(complete_items[j],j);
            if(!$task) continue;
            $task.addClass('completed');
            $task_list.append($task);
        }
        $delete_task_trigger=$('.anchor.delete');
        $detail_task_trigger=$('.anchor.detail');
        $checkbox_complete=$('.task-list .complete');
        listen_task_delete();
        listen_task_detail();
        listen_checkbox_complete();
    }
    //渲染单条task模板
    function render_task_tpl(data,index){
        if(!data||!index) return;
        var list_item_tpl =
            '<div class="task-item" data-index="'+index+'">' +
            '<span> <input class="complete" '+(data.complete ? 'checked':'')+' type="checkbox"></span>' +
            '<span class="task-content">'+data.content+'</span>' +
                '<span class="fr">'+
            '<span class="anchor delete">  删除 </span>' +
            '<span class="anchor detail">  详细 </span>' +
            '</span>'+
            '</div>';
        return $(list_item_tpl);
    }
    //——————————设置响铃部分————————
    function task_remind_check() {
        var current_timespan;
        //console.log(task_list);
        var itl = setInterval(function () {
            for (var i = 0; i < task_list.length; i++) {
                var item = store.get('task_list')[i];
                var task_timespan;
                if (!item || !item.remind_date||item.informed) continue;
                current_timespan = (new Date()).getTime();
                task_timespan = (new Date(item.remind_date)).getTime();
                if (current_timespan - task_timespan >= 1) {
                    update_task(i, {informed: true});
                    show_msg(item.content);
                }
            }

        },300);
    }
    function show_msg(msg) {
        if (!msg) return;
        $msg_content.html(msg);
        $alerter.get(0).play();
        $msg.show();
    }
    function listen_msg_event() {
        $msg_confirm.on('click', function () {
            hide_msg();

        })
    }
    function hide_msg() {
        $msg.hide();
    }
//——————————重写系统弹出框—————————
    function new_alert(arg){
        if(!arg){
            console.error('title is required');
        }
        var conf={}
            , $box
            , $mask
            , $title
            , $content
            , $confirm
            , $cancel
            , timer
            , dfd
            , confirmed
            ;
        dfd = $.Deferred();
        if(typeof  arg=='string')
        conf.title=arg;
        else
        {
            conf= $.extend(conf,arg);
        }
        $box=$(
            '<div>'+
            '<div class="alert-title">' + conf.title + '</div>' +
            '<div class="alert-content">' +
            '<div>' +
            '<button style="margin-right: 5px;" class="primary confirm">确定</button>' +
            '<button class="cancel">取消</button>' +
            '</div>' +
            '</div>' +
            '</div>'
        )
            .css({
                color:'#444',
                width:'300px',
                height:'auto',
                padding:'15px 10px',
                background:'#fff',
                position:'fixed',
                'border-radius':3,
                'box-shadow':'0 1px 2px rgba(0,0,0,.5)'
            })
        $title=$box.find('.alert-title').css({
            padding:'5px 10px',
            'font-weight':900,
            'font-size':20,
            'text-align':'center'
        })
        $content = $box.find('.alert-content').css({
            padding: '5px 10px',
            'text-align': 'center'
        })
        $confirm = $content.find('button.confirm');
        $cancel = $content.find('button.cancel');
        $mask = $('<div></div>')
            .css({
                position: 'fixed',
                background: 'rgba(0,0,0,.5)',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            })
        function adjust_box_position(){
            var window_width=$window.width()
                ,window_height=$window.height()
                ,box_width=$box.width()
                ,box_height=$box.height()
                ,move_x
                ,move_y
                ;
            move_x=(window_width-box_width)/2;
            move_y=((window_height-box_height)/2)-30;
            $box.css({
                left:move_x,
                top:move_y,
            })
        }
        timer=setInterval(function () {
            if(confirmed!==undefined){
                dfd.resolve(confirmed);
                clearInterval(timer);
                dismiss_alert();
            }
        },50)
        $confirm.on('click', on_confirmed);
        $cancel.on('click', on_cancel);
        $mask.on('click', on_cancel);
        function on_confirmed() {
            confirmed = true;
        }
        function on_cancel() {
            confirmed = false;
        }
        function dismiss_alert(){
            $mask.remove();
            $box.remove();
        }
        $window.on('resize',function(){
            adjust_box_position();
        })
        $mask.appendTo($body);
        $box.appendTo($body);
        $window.resize();
        return dfd.promise();
    }
})();
