/**
 * 实现基于RadViz的多维时序数据的可视化方法：
 * 方法原理与RadViz类似,区别在于颜色映射用渐进的颜色方案
 * @author:谢非
 */

(function(w) {
	var RadViz = function(config){
		var _ = {
			renderTo : {},//渲染的父元素id
			data : [],//多维时序数据
			startColor : {},//起始颜色
			endColor : {},//终止颜色
			canvas : {},//画布
			x0 : 110,//圆心坐标x
			y0 : 100,//圆心坐标y
			r : 90,//半径
			width : 300,//画布宽度
			height : 200//画布高度
		};
		this.get = function(key) {
			return _[key];
		};
		this.set = function(key, value) {
			_[key] = value;
		};
		this.configure(config);
		this.init();
	};
	RadViz.prototype = {
		configure : function(config){
			this.set("renderTo", config["renderTo"]);
			this.set("data", config["data"]);
			this.set("startColor", config["startColor"]);
			this.set("endColor", config["endColor"]);
		},
		setData : function(data){
			this.set("data", data);
			this.draw();
		},
		normalize : function(series, column) {
			if(series.length == 0)return;
			var min = series[0][column], max = series[0][column];
			for(var i = 0; i < series.length; i++) {
				if(min > series[i][column]) min = series[i][column];
				if(max < series[i][column]) max = series[i][column];
			}
			for(var i = 0; i < series.length; i++) {
				var temp = series[i][column];
				if(max != min) {
					series[i][column] = (temp - min)/(max - min);
				} else {
					series[i][column] = 0;//都相等归一化后都为0
				}
			}
		},
		getGradientColor : function(start, end, totalStep) {
			var step = 1;
			var colorMap = [];
			while(step <= totalStep) {
				var r = Math.ceil(start.r * ((totalStep - step)/totalStep) + end.r * (step/totalStep));
				var g = Math.ceil(start.g * ((totalStep - step)/totalStep) + end.g * (step/totalStep));
				var b = Math.ceil(start.b * ((totalStep - step)/totalStep) + end.b * (step/totalStep));
				var color = 'rgb('+ r + ',' + g + ','+ b +')';
				colorMap.push(color);
				step++;
			}
			return colorMap;
		},
		init : function(){
			var me = this;
			var canvas = document.createElement("canvas");
			this.set("canvas", canvas);
			var ctx = canvas.getContext("2d");
			canvas.width = "300";
			canvas.height = "200";
			var id = me.get("renderTo");
			var element = document.getElementById(id);
			var width = element.offsetWidth - 28;
			var height = element.offsetHeight;
			me.set("width", width);
			me.set("height", height);
			element.appendChild(canvas);
			me.draw();//绘制数据
		},
		draw : function() {
			var me = this;
			var data = me.get("data");
			var canvas = me.get("canvas");
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			var x0 = me.get("x0"), y0 = me.get("y0");//圆心的坐标
			var r = me.get("r");//半径
			var id = me.get("renderTo");
			var element = document.getElementById(id);
			var width = element.offsetWidth - 28;
			var height = element.offsetHeight;
			//获取key值组成的数组
			if(data == undefined || data.length == 0) {
				return;
			}
			var keyList = [];
			for(var key in data[0]) {
				keyList.push(key);
				me.normalize(data, key)
			}
			var n = keyList.length;//维度的个数

			/*
			//维度相似度排序TO-DO
			*/
		
			//绘制主单位圆
			ctx.beginPath();
			var x0 = me.get("x0"), y0 = me.get("y0");//圆心的坐标
			var r = me.get("r");//半径
			ctx.arc(x0, y0 , r, 0, Math.PI*2, true);
			ctx.closePath();
			ctx.stroke();

			//绘制维度锚点
			var rd = 5;//锚点的半径
			for(var i = 0; i < n; i++) {
				var x = x0 + r*Math.cos(2*Math.PI*i/n);
				var y = y0 + r*Math.sin(2*Math.PI*i/n);
				ctx.beginPath();
				ctx.arc(x, y,rd, 0, 2*Math.PI, false);
				ctx.closePath();
				ctx.fillStyle = "gray";
				ctx.fill();
				//绘制维度文字
				ctx.fillStyle = "black";
				ctx.font = "2px sans-serif";
				
				if(x < x0 && y < y0) {
					var maxx = Math.max(x - 1 -ctx.measureText(keyList[i]).width/2, 0.5 );
					ctx.fillText(keyList[i], maxx, y - 1);
				} else if(x < x0 && y >= y0) {
					var maxx = Math.max(x - 1 -ctx.measureText(keyList[i]).width/2, 0.5 );
					ctx.fillText(keyList[i], maxx, y + 1);
				} else if(x >= x0 && y < y0) {
					var minx = Math.min(x + 1 - ctx.measureText(keyList[i]).width/2, width - ctx.measureText(keyList[i]).width);
					ctx.fillText(keyList[i], minx, y - 1);
				} else if(x >= x0 && y >= y0) {
					var minx = Math.min(x + 1 - ctx.measureText(keyList[i]).width/2, width - ctx.measureText(keyList[i]).width);
					ctx.fillText(keyList[i], minx , y + 1);
				}
			}
			
			//生成渐变的颜色映射数组
			var start = me.get("startColor");
			var end = me.get("endColor");
			var totalStep = data.length;
			var colorMap = me.getGradientColor(start, end, totalStep);
			

			//绘制数据点
			for(var i = 0; i < data.length; i++) {
				var sum0 = 0, sum1 = 0, sum2 = 0;
				for(var j = 0; j < keyList.length; j++) {
					sum0 += data[i][keyList[j]] * (r*Math.cos(2*Math.PI*j/n));
					sum1 += data[i][keyList[j]] * (r*Math.sin(2*Math.PI*j/n));
					sum2 += data[i][keyList[j]];
				}
				var x, y;
				if(sum2 == 0) {
					x = x0;
					y = y0;
				} else {
					x = x0 + sum0 / sum2;
					y = y0 + sum1 / sum2;
				}
				ctx.beginPath();
				ctx.arc(x,y, 3, 0, 2*Math.PI, true);
				ctx.closePath();
				ctx.fillStyle = colorMap[i];
				ctx.fill();
			}
		}
	};
	w.RadViz = RadViz;
})(window);