'use strict';

angular.module('socialjukeboxwebApp').
constant('YT_event', {
    STOP:            0,
    PLAY:            1,
    PAUSE:           2,
    STATUS_CHANGE:   3
});

angular.module('socialjukeboxwebApp').
controller('userPlaylistController', function ($scope, Principal, ngTableParams,$stateParams,$http,YT_event, $timeout) {
    $scope.lecture= true;
    $scope.songs = [];
    $scope.urlParam=$stateParams.id;
    $scope.videoIterator = 0;

    Principal.identity().then(function(account) {
        $scope.account = account;
        $scope.isAuthenticated = Principal.isAuthenticated;
    });   

    function getPlaylist() {
        $http.get(window.location.pathname+"api/playlists/"+$scope.urlParam).success(function(data) {
            $scope.songs = data.songs;
            $scope.playlistName = data.name;
            $scope.youtubeVideosIds = new Array();
            for (var i = 0; i < data.songs.length; i++) {
                $scope.youtubeVideosIds.push($scope.songs[i].url.split("=")[1]);
            }
            $scope.yt.videoid = $scope.youtubeVideosIds[0];
            $scope.refreshSongs();
        })
    };

    getPlaylist();

    $scope.yt = {
        width: 500, 
        height: 80
    };

    $scope.YT_event = YT_event;

    $scope.nextSong = function () {
        $scope.playlistLength = $scope.youtubeVideosIds.length - 1;
        if($scope.videoIterator < $scope.playlistLength)
        {
            $scope.videoIterator++;
            $scope.yt.videoid =  $scope.youtubeVideosIds[$scope.videoIterator];
        }
        else {
            $scope.videoIterator = 0;
            $scope.yt.videoid =  $scope.youtubeVideosIds[$scope.videoIterator];
        }
    }

    $scope.previousSong = function () {
        $scope.playlistLength = $scope.youtubeVideosIds.length - 1;
        if($scope.videoIterator > 0){
            $scope.videoIterator--;
            $scope.yt.videoid =  $scope.youtubeVideosIds[$scope.videoIterator];
        }
        else {
            $scope.videoIterator = $scope.playlistLength;
            $scope.yt.videoid =  $scope.youtubeVideosIds[$scope.videoIterator];            
        }
    }

    $scope.selectSong = function (position) {
        $scope.videoIterator = position;
        $scope.yt.videoid =  $scope.youtubeVideosIds[$scope.videoIterator]; 
    }

    $scope.sendControlEvent = function (yt_event) {
        $scope.lecture = !$scope.lecture;
        this.$broadcast(yt_event);
    };
    $scope.$on(YT_event.STATUS_CHANGE, function(event, data) {
        $scope.yt.playerStatus = data;
        if (data == "PAUSED") {
            $scope.lecture = false;
        }
        if (data == "NOT PLAYING") {
            event.target.playVideo();
        }
        if (data == "PLAYING") {
            $scope.lecture = true;
        }
        if (data == "ENDED") {
            $scope.videoIterator++;
            $scope.yt.videoid =  $scope.youtubeVideosIds[$scope.videoIterator];
        }
    });

    $scope.postSong = function() {

        $scope.success=false;
        $scope.error=false;   		
        $http.post(window.location.pathname+'api/submission/submit?name='+$scope.title+'&idPlaylist='+$scope.urlParam).
        success(function(data, status, headers, config) {
            $scope.success=true;
            $scope.submittedSong=$scope.title;
            $scope.title="";
        }).

        error(function(data, status, headers, config) {
            $scope.error=true;
            $scope.title=""; 
        }); 

    }
    $scope.refreshSongs = function() {
        $http.get(window.location.pathname+"api/playlists/"+$scope.urlParam).success(function(data) {
            $scope.songs = data.songs;
            $scope.playlistName = data.name;
            $scope.youtubeVideosIds = new Array();
            for (var i = 0; i < data.songs.length; i++) {
                $scope.youtubeVideosIds.push($scope.songs[i].url.split("=")[1]);
            }
        })
        $timeout( function(){ $scope.refreshSongs(); }, 3000);
    }

});

angular.module('socialjukeboxwebApp')
    .directive('youtube', function($window, YT_event) {
    return {
        restrict: "E",

        scope: {
            height: "@",
            width: "@",
            videoid: "@"
        },

        template: '<div></div>',

        link: function(scope, element, attrs, $rootScope, $timeout) {
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            var player;

            $window.onYouTubeIframeAPIReady = function() {

                player = new YT.Player(element.children()[0], {
                    playerVars: {
                        autoplay: 0,
                        html5: 1,
                        theme: "light",
                        modesbranding: 0,
                        color: "white",
                        iv_load_policy: 3,
                        showinfo: 1,
                        controls: 1
                    },

                    height: scope.height,
                    width: scope.width,
                    videoId: scope.videoid, 

                    events: {
                        'onReady': function(event) {
                            event.target.playVideo();
                        },
                        'onStateChange': function(event) {
                            var message = {
                                event: YT_event.STATUS_CHANGE,
                                data: ""
                            };

                            switch(event.data) {
                                case YT.PlayerState.PLAYING:
                                    message.data = "PLAYING";
                                    break;
                                case YT.PlayerState.ENDED:
                                    message.data = "ENDED";
                                    break;
                                case YT.PlayerState.UNSTARTED:
                                    event.target.playVideo();
                                    message.data = "NOT PLAYING";
                                    break;
                                case YT.PlayerState.PAUSED:
                                    message.data = "PAUSED";
                                    break;
                            }

                            scope.$apply(function() {
                                scope.$emit(message.event, message.data);
                            });
                        }
                    } 
                });
            };

            scope.$watch('videoid', function(newValue, oldValue) {
                if (newValue == oldValue) {
                    return;
                }
                if (!player){
                    $window.onYouTubeIframeAPIReady();
                }
                else {
                    player.cueVideoById(scope.videoid);
                }
            });

            scope.$on(YT_event.PLAY, function () {
                player.playVideo();
            }); 

            scope.$on(YT_event.PAUSE, function () {
                player.pauseVideo();
            });  
        }  
    };
});