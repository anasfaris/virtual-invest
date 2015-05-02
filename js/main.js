$(function() {
    var companies = new Array();
    var stocks = new Array();
    var total_price = 0.0;
    var username = "";
    var cash = 0.0;
    var selected_company_name = "";

    $('#ready').hide();
    $(".profile").hide();

    $('.btn_login').click(function() {
        var login_type;

        if ($(this).html() == "Login") {
            login_type = "Login";
        } else if ($(this).html() == "Logout") {
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
            success: function(data) {
                if (user == "" && login_type == "Login")
                    alert("Wrong username");
                else if (user != "" && login_type == "Login") {
                    $.each(data, function(i, investor) {
                        username = investor.username;
                        $(".profile").show();
                        $("#login").hide();
                        $("#user").html("Name: " + investor.name);
                        $("#username").html("Username: " + investor.username);
                        cash = investor.cash;
                        $("#cash").html("Cash: $" + cash.toFixed(2));

                        $('#investment').html('<tr><th>Name</th><th>Quantity</th><th>Profit/Loss</th></tr>');
                        $.each(investor.investment, function(i, stock) {
                            var temp = {
                                'name': stock.name,
                                'real_name': stock.real_name,
                                'quantity': stock.quantity,
                                'paid': stock.paid
                            };
                            stocks.push(temp);

                            var stock_profit = 0;
                            $.each(companies, function(i, company) {
                                if (company.name == stock.name) {
                                    stock_profit = (stock.quantity * company.price - stock.paid) / stock.paid * 100;
                                }
                            });

                            $('#investment').append(
                                '<tr>' +
                                '<td>' + stock.real_name + '</td>' +
                                '<td id="qty_' + stock.name + '">' + stock.quantity + '</td>' +
                                '<td id="paid_' + stock.name + '">' + stock_profit.toFixed(2) + '%</td>' +
                                '</tr>'
                            );
                        });
                    });
                } else {
                    $(".profile").hide();
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
                    'real_name': company.real_name,
                    'price': company.price,
                    'change': company.change,
                    'last_price': company.last_price,
                    'price_opening': company.price_opening
                };
                companies.push(temp);

                var change_percentage = (company.price - company.last_price) / company.last_price * 100.0;
                    // Print company data unto table
                $('#summary').append(
                    '<tr>' +
                    '<td>' + company.real_name + '</td>' +
                    '<td id="price_' + company.name + '">' + company.price.toFixed(2) + '</td>' +
                    '<td id="percentage_' + company.name + '">' + change_percentage.toFixed(2) + '</td>' +
                    '</tr>'
                );

                $('#select_company').append(
                    '<option>' + company.real_name + '</option>'
                );
            });

            // First thing first
            $.ajax({
                type: "GET",
                url: "/investor_api",
                success: function(data) {
                    $.each(data, function(i, investor) {
                        username = investor.username;
                        $(".profile").show();
                        $("#login").hide();
                        $("#user").html("Name: " + investor.name);
                        $("#username").html("Username: " + investor.username);
                        cash = investor.cash;
                        $("#cash").html("Cash: $" + cash.toFixed(2));

                        $('#investment').html('<tr><th>Name</th><th>Quantity</th><th>Profit/Loss</th></tr>');
                        $.each(investor.investment, function(i, stock) {
                            var temp = {
                                'name': stock.name,
                                "real_name": stock.real_name,
                                'quantity': stock.quantity,
                                'paid': stock.paid
                            };
                            stocks.push(temp);

                            var stock_profit = 0;
                            $.each(companies, function(i, company) {
                                if (company.name == stock.name) {
                                    stock_profit = (stock.quantity * company.price - stock.paid) / stock.paid * 100;
                                }
                            });

                            $('#investment').append(
                                '<tr>' +
                                '<td>' + stock.real_name + '</td>' +
                                '<td id="qty_' + stock.name + '">' + stock.quantity + '</td>' +
                                '<td id="paid_' + stock.name + '">' + stock_profit.toFixed(2) + '%</td>' +
                                '</tr>'
                            );
                        });
                    });
                },
                dataType: 'json'
            });

        },
        dataType: 'json'
    });

    // Price update
    $('#select_company').change(function(event) {
        $.each(companies, function(i, company) {
            if (company.real_name == $('#select_company').val()) {
                selected_company_name = company.name;
                $('#ready').show();
                $('#price').html("Price: " + company.price.toFixed(2));
                total_price = company.price * $('#quantity').val();
                $('#total_price').html("Total price: " + total_price.toFixed(2));

                if (cash < total_price || $('#quantity').val() < 0 || !total_price) {
                    $('#btn_buy').hide();
                } else {
                    $('#btn_buy').show();
                }
                $.each(stocks, function(i, stock) {
                    if (company.name == stock.name) {
                        if (stock.quantity < $('#quantity').val()) {
                            $('#btn_sell').hide();
                        } else {
                            $('#btn_sell').show();
                        }
                    }
                });
            }
        });
    });

    $('#quantity').keyup(function(event) {
        $.each(companies, function(i, company) {
            if (company.real_name == $('#select_company').val()) {
                total_price = company.price * $('#quantity').val();
                $('#total_price').html("Total price: " + total_price.toFixed(2));

                if (cash < total_price || $('#quantity').val() < 0 || !total_price) {
                    $('#btn_buy').hide();
                } else {
                    $('#btn_buy').show();
                }

                $.each(stocks, function(i, stock) {
                    if (company.name == stock.name) {
                        if (stock.quantity < $('#quantity').val()) {
                            $('#btn_sell').hide();
                        } else {
                            $('#btn_sell').show();
                        }
                    }
                });
            }
        });
    });

    $('.btn_trade').click(function() {
        var trade_type;

        if ($(this).html() == "Buy") {
            trade_type = "Buy";
        } else if ($(this).html() == "Sell")
            trade_type = "Sell"

        $.ajax({
            type: "POST",
            url: "/trade_api",
            data: JSON.stringify({
                stock: {
                    'name': selected_company_name,
                    'price': total_price,
                    'quantity': $('#quantity').val(),
                    'trade_type': trade_type,
                    'username': username
                }
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(result) {
                $.each(companies, function(i, company) {
                    if (company.real_name == $('#select_company').val()) {
                        company.price = result.price;
                        $('#price').html("Price: " + company.price.toFixed(2));
                        total_price = company.price * $('#quantity').val();
                        $('#total_price').html("Total price: " + total_price.toFixed(2));

                        if (cash < total_price || $('#quantity').val() < 0 || !total_price) {
                            $('#btn_buy').hide();
                        } else {
                            $('#btn_buy').show();
                        }

                        var change_percentage = (company.price - company.last_price) / company.last_price * 100.0;
                        $('#percentage_' + company.name).html(change_percentage.toFixed(2));

                        $.each(stocks, function(i, stock) {
                            if (company.name == stock.name) {
                                stock.quantity = result.quantity;
                                if (stock.quantity < $('#quantity').val()) {
                                    $('#btn_sell').hide();
                                } else {
                                    $('#btn_sell').show();
                                }
                            }
                        });
                    }
                });

                $('#price_' + result.name).html(result.price.toFixed(2));
                $('#qty_' + result.name).html(result.quantity);
                cash = result.cash;
                $('#cash').html("Cash: $" + cash.toFixed(2));
            },
            failure: function(err) {
                alert(err);
            }
        });
    });

});
