coolie.config({
    cache: window.abc ? true: false,
    base: './app/',
    host: ''
}).callback(function () {
    alert(123);
}).use().callback(function () {
    alert(456);
});