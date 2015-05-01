$(function() {
    var companies = new Array();
    var total_price = 0.0;
    var username = "";
    var cash = 0.0;

    $('#ready').hide();
    $("#profile").hide();

    // First thing first
    $.ajax({
        type: "GET",
        url: "/investor_api",
        success: function(data) {
            $.each(data, function(i, investor) {
                username = investor.username;
                $("#profile").show();
                $("#login").hide();
                $("#user").html("Name: " + investor.name);
                $("#username").html("Username: " + investor.username);
                cash = investor.cash;
                $("#cash").html("Cash: $" + cash.toFixed(2));
            });
        },
        dataType: 'json'
    });

    $('.btn_login').click(function() {
        var login_type;

        if ($(this).html() == "Login"){
            login_type = "Login";
        }
        else if ($(this).html() == "Logout") {
            login_type = "Logout"
        }

        $.ajax({
            type: "POST",
            url: "/login",
            data: JSON.stringify({
                login_info: {
                    'username': $('#login_username').val(),
                    'login_type': login_type
                }
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(user){
                if (user == "" && login_type == "Login")
                    alert("Wrong username");
                else if (user != "" && login_type == "Login") {
                    $('#login').hide();
                    $.each(user, function(i, investor) {
                        username = investor.username;
                        $("#profile").show();
                        $("#user").html("Name: " + investor.name);
                        $("#username").html("Username: " + investor.username);
                        cash = investor.cash;
                        $("#cash").html("Cash: $" + cash);
                    });
                } else {
                    $("#profile").hide();
                    $("#login").show();
                    alert("You have successfully logged out");
                }
            },
            failure: function(err) {
                alert(err);
            }
        });
    });

    // Get all companies
    $.ajax({
        type: "GET",
        url: "/companies_api",
        success: function(data) {
            $.each(data, function(i, company) {
                var temp = {
                    'name': company.name,
                    'price': company.price,
                    'change': company.change,
                    'change_percentage': company.change_percentage
                };
                companies.push(temp);

                // Print company data unto table
                $('#summary').append(
                    '<tr>' +
                    '<td>' + company.name + '</td>' +
                    '<td id="price_' + company.name + '">' + company.price.toFixed(2) + '</td>' +
                    '<td>' + company.change + '</td>' +
                    '<td>' + company.change_percentage + '</td>' +
                    '</tr>'
                );

                $('#select_company').append(
                    '<option>' + company.name + '</option>'
                );
            });
        },
        dataType: 'json'
    });

    // Price update
    $('#select_company').change(function(event) {
        $.each(companies, function(i, company) {
            if (company.name == $('#select_company').val()) {
                $('#ready').show();
                $('#price').html("Price: " + company.price.toFixed(2));
                total_price = company.price * $('#quantity').val();
                $('#total_price').html("Total price: " + total_price.toFixed(2));

                if (cash < total_price) {
                    $('#btn_buy').hide();
                } else {
                    $('#btn_buy').show();
                }
            }
        });
    });

    $('#quantity').keyup(function(event) {
        $.each(companies, function(i, company) {
            if (company.name == $('#select_company').val()) {
                total_price = company.price * $('#quantity').val();
                $('#total_price').html("Total price: " + total_price.toFixed(2));

                if (cash < total_price) {
                    $('#btn_buy').hide();
                } else {
                    $('#btn_buy').show();
                }
            }
        });
    });

    $('.btn_trade').click(function() {
        var trade_type;

        if ($(this).html() == "Buy"){
            trade_type = "Buy";
        }
        else if ($(this).html() == "Sell")
            trade_type = "Sell"

        $.ajax({
            type: "POST",
            url: "/trade_api",
            data: JSON.stringify({
                stock: {
                    'name': $('#select_company').val(),
                    'price': total_price,
                    'quantity': $('#quantity').val(),
                    'trade_type': trade_type,
                    'username': username
                }
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(result){
                $.each(companies, function(i, company) {
                    if (company.name == $('#select_company').val()) {
                        company.price = result.price;
                        $('#price').html("Price: " + company.price.toFixed(2));
                        total_price = company.price * $('#quantity').val();
                        $('#total_price').html("Total price: " + total_price.toFixed(2));

                        if (cash < total_price) {
                            $('#btn_buy').hide();
                        } else {
                            $('#btn_buy').show();
                        }
                    }
                });

                $('#price_' + result.name).html(result.price.toFixed(2));
                cash = result.cash;
                $('#cash').html("Cash: $" + cash.toFixed(2));
            },
            failure: function(err) {
                alert(err);
            }
        });
    });

});
