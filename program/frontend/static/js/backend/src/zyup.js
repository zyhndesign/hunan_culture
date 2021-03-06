/**
 * Created with JetBrains WebStorm.
 * User: ty
 * Date: 13-9-4
 * Time: 下午6:01
 *上传（新建、修改）作品资源模块
 */
var zyup=(function(){

    var currentMediaId=0;
    var currentMediaUploader=null;
    var uploadingMediaFile=null;

    var uploadedMedias={};
    var fileIdToMediaId={};

    var config={
        qiNiu:{
            swfUrl:"/zyup/js/plupload/plupload.flash.swf",
            upTokenUrl:"qiniu/uptoken",
            uploadDomain:"http://qiniu-plupload.qiniudn.com/",
            bucketDomain:"http://7u2fft.com1.z0.glb.clouddn.com/"
        },
        thumbs:{
            defaultThumb:"images/app/zyupDefaultThumb.png",
            smallThumb:"images/app/zyupDefaultSmallThumb.png"
        },
        ajaxUrls:{
            uploadFileUrl:"/zyup/upload.php",
            getEntityMedias:"admin/article/:id/assets"
        },
        uploader:{
            swfUrl:"/zyup/js/lib/Moxie.swf"
        },
        mediaTypes:{
            image:1,
            localVideo:2,
            ppt:4,
            _3d:8,
            file:16,
            flash:32
        },
        //单个媒体对象的信息
        mediaObj:{
            mediaPos:"pos",
            mediaTitle:"name",
            mediaMemo:"description",
            mediaType:"type",
            mediaThumbFilename:"profile_filename",
            mediaThumbFilePath:"profile_file",
            mediaFilename:"media_filename",
            mediaFilePath:"media_file"
        },
        mediaFilters:{
            imageFilter:"jpg,JPG,gif,GIF,png,PNG,jpeg,JPEG",
            pptFilter:"pptx",
            _3dFilter:"zip",
            videoFilter:"mp4",
            fileFilter:"zip,pdf",
            flashFilter:"swf"
        },
        sizes:{
            maxMediaSize:"300m", //最大的媒体文件上传大小
            maxImageSize:"2m" //最大的图片文件上传大小
        },
        messages:{
            errorTitle:"错误提示",
            optSuccRedirect:"操作成功,3秒后跳转到管理页！",
            successTitle:"成功提示",
            deleteConfirm:"确定删除吗？",
            operationSuccess:"操作成功！",
            networkError:"网络连接失败，请稍后重试！",
            filenameError:"文件名必须是数字下划线汉字字母,且不能以下划线开头！",
            hasNoMedia:"没有上传媒体文件或者有上传错误的媒体文件，请上传或者删除后再预览！",
            mediaHasNoUploaded:"有媒体文件未上传完毕！",
            stepOneUnComplete:"字段没有填写完整！",
            webVideoError:"请输入通用代码！",
            thumbSizeError:"请上传300x200的图片！",
            pptHasNotUploaded:"此资源还没有被上传到资源服务器，暂时不能查看！",
            pptUploadError:"此资源上传到资源服务器出错，无法查看！",
            uploadSizeError:"最大文件大小",
            uploadExtensionError:"只允许上传",
            uploadIOError:"服务器端异常，请刷新后重试！"
        }
    };

    /**
     * 显示错误信息===============
     * @param {String} title 信息的标题
     * @param {String} content 信息的内容
     */
    function showErrorMessage(title,content){
        $().toastmessage("showErrorToast",content);
    }

    /**
     * 显示成功的信息==================
     * @param {String} title 信息的标题
     * @param {String} content 信息的内容
     */
    function showSuccessMessage(title,content){
        $().toastmessage("showSuccessToast",content);
    }

    function showLoading(){
        $("#zyupLoading").removeClass("zyupHidden");
    }
    function hideLoading(){
        $("#zyupLoading").addClass("zyupHidden");
    }

    /**
     * ajax后台返回错误处理===================
     * @param {Object} errorCode 后台返回的数据对象
     */
    function ajaxReturnErrorHandler(errorCode){
        $().toastmessage("showErrorToast",config.messages.networkError);
        hideLoading();
    }

    function ajaxErrorHandler(){
        $().toastmessage("showErrorToast",config.messages.networkError);
        hideLoading();
    }

    /**
     * 格式化日期=====================
     * @returns {string}  返回格式化的日期
     */
    function toDay(){

        var date=new Date();

        var year=date.getFullYear();

        var month=date.getMonth()+1;

        var day=date.getDate();

        return year+"-"+month+"-"+day;

    }


    /**
     * 产生随机数，可以自带前缀arguments[0]============
     * @returns {string} 返回产生的字符串
     */
    function getRandom(){
        var date = new Date();
        var mo = (date.getMonth() + 1) < 10 ? ('0' + '' + (date.getMonth() + 1)) : date.getMonth() + 1;
        var dd = date.getDate() < 10 ? ('0' + '' + date.getDate()) : date.getDate();
        var hh = date.getHours() < 10 ? ('0' + '' + date.getHours()) : date.getHours();
        var mi = date.getMinutes() < 10 ? ('0' + '' + date.getMinutes()) : date.getMinutes();
        var ss = date.getSeconds() < 10 ? ('0' + '' + date.getSeconds()) : date.getSeconds();
        var retValue = date.getFullYear() + '' + mo + '' + dd + '' + hh + '' + mi + '' + ss + '';
        for (var j = 0; j < 4; j++) {
            retValue += '' + parseInt(10 * Math.random()) + '';
        }
        if (arguments.length == 1) {
            return arguments[0] + '' + retValue;
        }else{
            return retValue;
        }
    }

    /**
     * 拖拽函数====================
     */
    function drag(){
        var targetOl = document.getElementById("zyupMediaList");//容器元素
        var eleDrag = null;//被拖动的元素

        targetOl.onselectstart=function(event){
            if(event.target.className.match("zyupMediaItem")!==null){

                event.preventDefault();
                event.stopPropagation();
            }
        };
        targetOl.ondragstart=function(event){
            if(event.target.className.match("zyupMediaItem")!==null){
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text","移动中");
                eleDrag = event.target||event.srcElement;

                return true;
            }
        };
        targetOl.ondragend=function(event){
            if(event.target.className.match("zyupMediaItem")!==null){
                eleDrag=null;

                event.preventDefault();
                event.stopPropagation();
            }
        };

        //在元素中滑过
        targetOl.ondragover = function (event) {
            event.preventDefault();
            event.stopPropagation();
        };

        targetOl.ondrop=function(event){

            event.preventDefault();
            event.stopPropagation();
        };

        //ol作为最大的容器也要处理拖拽事件，当在li上滑动的时候放到li的前面，当在ol上滑动的时候放到ol的最后面
        targetOl.ondragenter = function (event) {
            var target=event.toElement||event.target;
            var targetParent=target.parentNode;
            if (target == targetOl) {
                targetOl.appendChild(eleDrag);
            }else{
                if(target.tagName=="LI"){
                    targetOl.insertBefore(eleDrag, target);
                }else{
                    targetOl.insertBefore(eleDrag, targetParent);
                }
            }

            event.preventDefault();
            event.stopPropagation();
        };
    }

    /**
     * 获取已经上传的媒体文件，即幻灯片（文章）的每一页，供预览使用=======================
     * @returns {Array} 返回对象数组
     */
    function  getSlidePages(){
        var arraySlides=[];
        $(".zyupMediaItem").each(function(index,m){
            var obj={};//幻灯片每一页的对象
            var mediaId=$(this).data("media-id");
            var title=uploadedMedias[mediaId][config.mediaObj.mediaTitle];
            var type=uploadedMedias[mediaId][config.mediaObj.mediaType];
            var memo=uploadedMedias[mediaId][config.mediaObj.mediaMemo];
            var imgSrc=uploadedMedias[mediaId][config.mediaObj.mediaThumbFilePath];
            var filePath=uploadedMedias[mediaId][config.mediaObj.mediaFilePath];
            var className="";

            obj.title=title?title:"";
            obj.memo=memo?memo:"";

            if(type==config.mediaTypes.ppt){
                className+=" zyupHasPpt zyupHasMedia";
            }else if(type==config.mediaTypes._3d){
                className+=" zyupHas3d zyupHasMedia";
            }else if(type==config.mediaTypes.localVideo){
                className+=" zyupHasLocalVideo zyupHasMedia";
            }else if(type==config.mediaTypes.file){
                className=" zyupHasFile zyupHasMedia";
            }else if(type==config.mediaTypes.flash){
                className+=" zyupHasFlash zyupHasMedia" ;
            }

            if(type==config.mediaTypes.image){
                obj.content='<img src="'+imgSrc+'"/>';
            }else{
                obj.content='<a data-media-type="'+type+'data-media-id="'+mediaId+
                    '" class="'+className+'" target="_blank" href="'+filePath+'"><img src="'+imgSrc+'"/></a>';
            }


            arraySlides.push(obj);
        });

        //将所有的幻灯片页返回
        return arraySlides;
    }

    /**
     * 显示步骤对应的面板==========================
     * @param {Number} stepId 需要显示的面板的id
     */
    function showStepPanel(stepId){
        $(".zyupStepPanel").addClass("zyupHidden");
        $(stepId).removeClass("zyupHidden");
        $(".zyupStepCurrent").removeClass("zyupStepCurrent");
        $(".zyupStep[href='"+stepId+"']").addClass("zyupStepCurrent");
    }


    /**
     * 将已经上传的媒体文件记录到uploadedMedias对象中(hash表)=================
     * @param {String} filename 媒体文件名称
     * @param {String} url 媒体文件地址
     * @param {String} mediaId 媒体文件media对象id
     */
    function initUploadedMediasObj(filename,url,mediaId){
        uploadedMedias[mediaId] = {

            //声明一个空的对象，后续将内容全部加入
        };

        uploadedMedias[mediaId][config.mediaObj.mediaThumbFilename] = filename;
        uploadedMedias[mediaId][config.mediaObj.mediaThumbFilePath] = url;
        uploadedMedias[mediaId][config.mediaObj.mediaFilename] = "";
        uploadedMedias[mediaId][config.mediaObj.mediaFilePath] = "";
        uploadedMedias[mediaId][config.mediaObj.mediaType] = config.mediaTypes.image;
        uploadedMedias[mediaId][config.mediaObj.mediaTitle] = "";
        uploadedMedias[mediaId][config.mediaObj.mediaMemo] = "";
    }

    /**
     * ==============================
     * @param params
     * @returns {plupload.Uploader}
     */
    function createUploader(params){
        var uploader=new plupload.Uploader({
            runtimes:"html5",
            multi_selection:params.multiSelection,
            max_file_size:params.maxSize,
            browse_button:params.uploadBtn,
            container:params.uploadContainer,
            multipart_params:params.multipartParams,
            url:params.url,
            //flash_swf_url:config.uploader.swfUrl,
            filters : [
                {title : "Media files", extensions : params.filter}
            ]
        });

        //初始化
        uploader.init();

        //文件添加事件
        uploader.bind("FilesAdded", function (up, files) {
            if(typeof params.filesAddedCb ==="function"){
                params.filesAddedCb(files,up);
            }

            //开始上传
            up.start();

        });

        //文件上传进度条事件
        uploader.bind("UploadProgress", function (up, file) {
            if(typeof params.progressCb ==="function"){
                params.progressCb(file);
            }
        });

        //出错事件
        uploader.bind("Error", function (up, err) {

            var message=err.message;
            if(message.match("Init")==null){
                if(message.match("size")){
                    showErrorMessage(config.messages.errorTitle,
                        config.messages.uploadSizeError+config.sizes.maxImageSize);
                }else if(message.match("extension")){
                    showErrorMessage(config.messages.errorTitle,
                        config.messages.uploadExtensionError+config.mediaFilters.imageFilter);
                }else{
                    showErrorMessage(config.messages.errorTitle,config.messages.uploadIOError);
                }
            }
            up.refresh();
        });

        //上传完毕事件
        uploader.bind("FileUploaded", function (up, file, res) {
            var response = JSON.parse(res.response);
            if (response.success) {
                if(typeof params.uploadedCb === "function"){
                    params.uploadedCb(file,response,up);
                }
            } else {
                showErrorMessage(config.messages.errorTitle,config.messages.uploadIOError);
            }
        });


        return uploader;
    }

    /**
     * =====================================
     * @param params
     * @returns {plupload.Uploader}
     */
    function createQiNiuUploader(params){
        var uploader = Qiniu.uploader({
            runtimes: 'html5',    //上传模式,依次退化
            browse_button: params.uploadBtn,       //上传选择的点选按钮，**必需**
            uptoken_url:  config.qiNiu.upTokenUrl,
            multi_selection:params.multiSelection,
            domain: config.qiNiu.uploadDomain,
            container: params.uploadContainer,//上传区域DOM ID，默认是browser_button的父元素，
            filters: {
                mime_types : [
                    { title : "media files", extensions : params.filter }
                ]
                //max_file_size:'1m'
            },
            //flash_swf_url:config.qiNiu.swfUrl,
            multipart_params:params.multipartParams,
            max_file_size: params.maxSize,    //最大文件体积限制,qiniu中需要写在这里，而不是卸载filters中
            max_retries: 3,                   //上传失败最大重试次数
            chunk_size: '4mb',                //分块上传时，每片的体积
            auto_start: true,                 //选择文件后自动上传，若关闭需要自己绑定事件触发上传
            init: {
                'Init':function(up,info){
                    //console.log(up.getOption("max_file_size"));
                },
                'FilesAdded': function(up, files) {
                    if(typeof params.filesAddedCb ==="function"){
                        params.filesAddedCb(files,up);
                    }
                },
                'BeforeUpload':function(up,file){

                },
                'UploadProgress': function(up, file) {
                    if(typeof params.progressCb ==="function"){
                        params.progressCb(file);
                    }
                },
                'FileUploaded': function(up, file, info) {
                    var response = JSON.parse(info);
                    response.url=config.qiNiu.bucketDomain + response.key;
                    if(typeof params.uploadedCb === "function"){
                        params.uploadedCb(file,response,up);
                    }
                },
                'Error': function(up, err, errTip) {
                    showErrorMessage("showErrorToast",errTip);

                    up.refresh();
                },
                'Key': function(up, file) {

                    // 若想在前端对每个文件的key进行个性化处理，可以配置该函数
                    // 该配置必须要在 unique_names: false , save_key: false 时才生效
                    var random=Math.floor(Math.random()*10+1)*(new Date().getTime());
                    var filename=file.name;
                    var extPos=filename.lastIndexOf(".");


                    // do something with key here
                    return random+filename.substring(extPos);

                    //return file.name;
                }
            }
        });

        return uploader;
    }

    /**
     * 提交前预览========================
     */
    function preview(){
        var data={};
        data.title=$("#zyupTitleInput").val();
        data.date=toDay();
        data.description=$("#zyupDescriptionTxt").val();
        data.medias=getSlidePages();
        var tpl=$("#zyupUploadPreviewTpl").html();
        var html=juicer(tpl,data);
        $("#zyupPreview").html(html);
    }

    return {
        drag:drag,
        config:config,
        fileIdToMediaId:fileIdToMediaId,
        uploadedMedias:uploadedMedias,
        showErrorMessage:showErrorMessage,
        createUploader:createUploader,

        /**
         * ===========================
         */
        createThumbUploader:function(){
            createQiNiuUploader({
                maxSize:config.sizes.maxImageSize,
                filter:config.mediaFilters.imageFilter,
                uploadBtn:"zyupThumbUploadBtn",
                multipartParams:null,
                multiSelection:false,
                uploadContainer:"zyupThumbContainer",
                url:config.ajaxUrls.uploadFileUrl,
                filesAddedCb:null,
                progressCb:null,
                uploadedCb:function(file,info,up){

                    //判断是否是1：1
                    $.get(info.url+"?imageInfo",function(data){
                            //console.log(data);
                            if(data.width==300&&data.height==200){
                                $("#zyupThumb").attr("src",info.url);
                                $("#zyupThumbUrl").val(info.url);
                            }else{
                                showErrorMessage(config.messages.errorTitle,config.messages.thumbSizeError)
                            }

                        });
                }
            });
        },
        /**
         * ===========================
         */
        createImageUploader:function(){
            createQiNiuUploader({
                maxSize:config.sizes.maxImageSize,
                filter:config.mediaFilters.imageFilter,
                uploadBtn:"zyupUploadImage",
                multipartParams:null,
                multiSelection:true,
                uploadContainer:"zyupUploadImageContainer",
                url:config.ajaxUrls.uploadFileUrl,
                filesAddedCb:function(files,up){
                    var mediaId = "";
                    var fileLength=files.length;

                    for (var i = 0; i < fileLength; i++) {


                        mediaId = getRandom("random_");
                        fileIdToMediaId[files[i]["id"]] = mediaId;

                        //组装显示的数据
                        var data = {
                            mediaId:mediaId,
                            thumbSrc:config.thumbs.smallThumb,
                            filename:"0%"
                        };

                        //显示列表项
                        var tpl = $("#zyupCompleteLiTpl").html();
                        var html = juicer(tpl, data);
                        $("#zyupMediaList").append(html);
                    }

                },
                progressCb:function(file){
                    $(".zyupMediaItem[data-media-id='" + fileIdToMediaId[file.id] + "']").
                        find(".zyupMediaFilename").html(file.percent + "%");
                },
                uploadedCb:function(file,response,up){
                    $(".zyupMediaItem[data-media-id='" + fileIdToMediaId[file.id] + "']").
                        find(".zyupMediaFilename").html(file.name).end().
                        find(".zyupDelete").removeClass("zyupHidden").end().find(".zyupSmallThumb").
                        attr("src",response.url);

                    initUploadedMediasObj(file.name,response.url,fileIdToMediaId[file.id]);
                }
            });
        },
        /**
         * ========================
         */
        createMediaUploader:function(params){
            createQiNiuUploader({
                maxSize:config.sizes.maxMediaSize,
                filter:params.filter,
                uploadBtn:params.browseButton,
                multipartParams:null,
                multiSelection:false,
                uploadContainer:"zyupAddMediaMenu",
                url:config.ajaxUrls.uploadFileUrl,
                filesAddedCb:function(files,up){
                    uploadingMediaFile=files[0];
                    currentMediaUploader=up;
                    uploadedMedias[currentMediaId][config.mediaObj.mediaFilename]="0%";
                    $("#zyupBindFileName").text("0%");
                    $("#zyupBindFileInfo").removeClass("zyupHidden");
                },
                progressCb:function(file){
                    $("#zyupBindFileName").text(file.percent + "%");
                },
                uploadedCb:function(file,response,up){
                    uploadingMediaFile=null;
                    currentMediaUploader=null;
                    uploadedMedias[currentMediaId][config.mediaObj.mediaFilename]=file.name;
                    uploadedMedias[currentMediaId][config.mediaObj.mediaFilePath]=response.url;
                    uploadedMedias[currentMediaId][config.mediaObj.mediaType]=params.type;
                    $("#zyupBindFileName").text(file.name);
                }
            });
        },
        /**
         * ==========================
         */
        createMediaThumbUploader:function(){
            createQiNiuUploader({
                maxSize:config.sizes.maxImageSize,
                filter:config.mediaFilters.imageFilter,
                uploadBtn:"zyupUpdateThumbButton",
                multipartParams:null,
                multiSelection:false,
                uploadContainer:"zyupUpdateThumbContainer",
                url:config.ajaxUrls.uploadFileUrl,
                filesAddedCb:null,
                progressCb:null,
                uploadedCb:function(file,response){
                    uploadedMedias[currentMediaId][config.mediaObj.mediaThumbFilename]=file.name;
                    uploadedMedias[currentMediaId][config.mediaObj.mediaThumbFilePath]=response.url;
                    $(".zyupMediaItem[data-media-id='" + currentMediaId + "']").
                        find(".zyupMediaFilename").html(file.name).end().find(".zyupSmallThumb").
                        attr("src",response.url);
                    $("#zyupMediaThumb").attr("src",response.url);
                }
            });
        },

        /**
         * 删除已经上传的文件=========================================
         * @param {Object} target 需要删除的文件的项目中删除按钮span.zyupUnCompleteLi
         */
        deleteUploadedFileHandler:function(target){
            if(confirm(config.messages.deleteConfirm)){
                var mediaId=target.parent().data("media-id");
                uploadedMedias[mediaId]=undefined;
                delete uploadedMedias[mediaId];
                target.parents("li").remove();

                //清空数据
                $("#zyupMediaThumb").attr("src",config.thumbs.defaultThumb);
                $("#zyupMediaTitle").val("");
                $("#zyupMediaMemo").val("");
                $("#zyupBindFileName").text("");
            }
        },

        /**
         * 已经上传的文件列表项点击事件处理==========================================
         * @param {Object} target 点击的项目中的a.zyupMediaItem
         */
        uploadedLiClickHandler:function(target){
            var active=$(".zyupMediaItemActive"),
                currentMediaObj;
            if(active.length!=0){
                active.removeClass("zyupMediaItemActive");
            }

            currentMediaId=target.data("media-id");
            currentMediaObj=uploadedMedias[currentMediaId];

            //设置数据
            $("#zyupMediaThumb").attr("src",currentMediaObj[config.mediaObj.mediaThumbFilePath]);
            $("#zyupMediaTitle").val(currentMediaObj[config.mediaObj.mediaTitle]);
            $("#zyupMediaMemo").val(currentMediaObj[config.mediaObj.mediaMemo]);

            if(currentMediaObj[config.mediaObj.mediaFilename]){
                $("#zyupBindFileName").text(currentMediaObj[config.mediaObj.mediaFilename]);
                $("#zyupBindFileInfo").removeClass("zyupHidden");
            }else{
                $("#zyupBindFileInfo").addClass("zyupHidden");
            }


            //控制类
            target.addClass("zyupMediaItemActive");

            $("#zyupContent").removeClass("zyupHidden");

        },
        /**
         * ============================
         * @param value
         */
        setMediaTitle:function(value){
            uploadedMedias[currentMediaId][config.mediaObj.mediaTitle]=value;
        },
        /**
         * ==================
         */
        deleteBindFile:function(){
            if(confirm(config.messages.deleteConfirm)){
                if(currentMediaUploader){
                    currentMediaUploader.removeFile(uploadingMediaFile);
                    currentMediaUploader.stop();
                }

                uploadedMedias[currentMediaId][config.mediaObj.mediaFilename]="";
                uploadedMedias[currentMediaId][config.mediaObj.mediaFilePath]="";
                uploadedMedias[currentMediaId][config.mediaObj.mediaType]=config.mediaTypes.image;

                $("#zyupBindFileName").text("");
                $("#zyupBindFileInfo").addClass("zyupHidden");
            }
        },
        /**
         * ================================
         * @param value
         */
        setMediaMemo:function(value){
            uploadedMedias[currentMediaId][config.mediaObj.mediaMemo]=value;
        },



        /**
         * 上传的步骤控制=========================
         * @param {Number} stepId 需要显示的面板的id
         * @returns {boolean} 如果不可点的时候，需要返回false
         */
        stepHandler:function(stepId){
            if(stepId!="#zyupStep1"){
                if($("#zyupStep1 .zyupInputGray:eq(0)").val()==""||$("#zyupThumbUrl").val()==""||
                    $("#zyupStep1 .zyupInputGray:eq(3)").val()==""||
                    $("#zyupStep1 .zyupInputGray:eq(4)").val()==""||
                    $("#zyupStep1 .zyupInputGray:eq(5)").val()==""){
                    showErrorMessage(config.messages.errorTitle,config.messages.stepOneUnComplete);
                    return false;
                }
            }

            if(stepId=="#zyupStep3"){

                //判断第二中的内容是否都已经填写完整。

                if(!$.isEmptyObject(uploadedMedias)){

                    for(var obj in uploadedMedias){

                        if(uploadedMedias[obj][config.mediaObj.mediaThumbFilename].indexOf("%")!=-1&&
                            uploadedMedias[obj][config.mediaObj.mediaThumbFilename].indexOf(".")==-1){
                            showErrorMessage(config.messages.errorTitle,config.messages.mediaHasNoUploaded);
                            return false;
                        }

                        if(uploadedMedias[obj][config.mediaObj.mediaFilename].indexOf("%")!=-1&&
                            uploadedMedias[obj][config.mediaObj.mediaFilename].indexOf(".")==-1){
                            showErrorMessage(config.messages.errorTitle,config.messages.mediaHasNoUploaded);
                            return false;
                        }
                    }
                }else{
                    showErrorMessage(config.messages.errorTitle,config.messages.hasNoMedia);
                    return false;
                }

                //显示
                //preview();
            }

            showStepPanel(stepId);

            //一定要在页面显示后初始化，不然ie里面无法使用上传插件
            /*if(stepId=="#zyupStep2"&&!step2UploaderInit){
                this.createMediaUploader({type:config.mediaTypes.localVideo,browseButton:"zyupUploadMp4",
                    filter:config.mediaFilters.videoFilter});
                this.createMediaUploader({type:config.mediaTypes._3d,browseButton:"zyupUpload3D",
                    filter:config.mediaFilters._3dFilter});

                step2UploaderInit=true;
            }*/
        },

        /**
         * 表单提交=========================
         */
        ajaxUploadFormHandler:function(){
            var url=config.ajaxUrls.uploadFormAction;
            var assets=[];
            $(".zyupMediaItem").each(function(index,m){
                uploadedMedias[$(this).data("media-id")][config.mediaObj.mediaPos]=index+1;
                assets.push(uploadedMedias[$(this).data("media-id")]);
            });

            showLoading();

            $("#zyupForm").ajaxSubmit({
                data:{
                    assets:JSON.stringify(assets)
                },
                dataType:"json",
                success:function (response) {
                    if(response.data.success){
                        showSuccessMessage(config.messages.successTitle,config.messages.optSuccRedirect);
                        setTimeout(function(){
                            window.location.href="admin/article";
                        },3000);
                    }else{
                        ajaxReturnErrorHandler(response.data.error_code);
                    }
                },
                error:function (data) {
                    ajaxErrorHandler();
                }
            });
        },
        getPostAssets:function(id){
            $.ajax({
                url:config.ajaxUrls.getEntityMedias.replace(":id",id),
                dataType:"json",
                type:"get",
                success:function(response){
                    if(response.data.success){
                        var length=response.data.assets.length;
                        for(var i=0;i<length;i++){
                            uploadedMedias[i+1]=response.data.assets[i];
                        }
                    }else{
                       ajaxReturnErrorHandler(response.data.error_code);
                    }
                },
                error:function(){
                    showErrorMessage(config.messages.errorTitle,config.messages.networkError);
                }
            });
        }
    }
})();

