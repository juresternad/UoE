<?php
header("X-XSS-Protection: 0"); // ;-)

$FILE_DIREC = "image/";
$BANNED = array("html", "php", "js");


// Reload the page
function reload_page()
{
    print("<script>location.reload()</script>");
}

// Get the databaase
function get_db()
{
    $db = new PDO('sqlite:db/imagevoting.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $db;
}

// Check if user already submit image link
function check_uniqueness($db, $username)
{
    $check = $db->prepare("SELECT * FROM image WHERE user=:name");
    $check->bindParam(':name', $username);
    $result = $check->execute();

    if ($result)
    {
     	while ($row = $check->fetch())
        {
            return False;
        }
	return True;
    }

    return False;
}

// Create a session token
function create_token($username)
{
    setcookie("username", $username);
    setcookie("session", md5($username));
}

// Check a session token
function check_token($username, $session)
{
    return (md5($username) == $session);
}

// Destroy the session token
function logout()
{
    setcookie("username", "", time()-3600);
    setcookie("session", "", time()-3600);
}

function login($username, $password)
{
    try
    {
     	$db = get_db();

        $check = $db->prepare("SELECT * FROM users WHERE username=:name AND password=:pass");
        $check->bindParam(':name', $username);
        $check->bindParam(':pass', $password);
        $result = $check->execute();

        while ($row = $check->fetch())
        {
            create_token($username);
            return True;
        }

	return False;
    }
    catch(PDOException $e)
    {
     	print($e->getMessage());
    }
}

function register($username, $password, $signature)
{
    try
    {
        // Add to users
     	$db = get_db();
        $check = $db->prepare("INSERT INTO users (username, password, signature) VALUES (:name, :pass, :sig)");
        $check->bindParam(':name', $username);
        $check->bindParam(':pass', $password);
        $check->bindParam(':sig', $signature);
        $result = $check->execute();

        // Add to vote
        $check = $db->prepare("INSERT INTO vote (vote, user) VALUES (0, :name)");
        $check->bindParam(':name', $username);
        $result = $check->execute();

        // Add to votereceived

        $check = $db->prepare("INSERT INTO votereceived (vote, user) VALUES (0, :name)");
        $check->bindParam(':name', $username);
        $result = $check->execute();
        
        if ($result == 1) {
            return True;
        } else {
            return False;
        }
    }
    catch(PDOException $e)
    {
     	print($e->getMessage());
    }
}

// Check if there is a user signed in
function check_signed_in()
{
    if (isset($_COOKIE['username'], $_COOKIE['session']))
    {
        if (check_token($_COOKIE['username'], $_COOKIE['session']))
     	{   return True; }
        else
        {
            logout();
        }
    }
    return False;
}



// Retrieve Image List
function get_image_list()
{
    try
    {
        $db = get_db();

        image_submit_form();

        $messages = $db->prepare("SELECT * FROM image inner join votereceived on image.user=votereceived.user");
        $result = $messages->execute();

       	while ($row = $messages->fetch())
        {
            $user_str = "".$row['user'];
            $sig = $db->prepare('SELECT signature FROM users WHERE username = :name');
            $sig->bindValue(':name', $user_str);
            $sig_result = $sig->execute();
            $sig_val = $sig->fetch();
            print "<blockquote>";
            print "<p>";
     	    print "<img src='".$row['link']."' />";
            print "</p>";
            print "<footer>";
            print "<cite>";
            print $row['user'] . " - " . $sig_val['signature'];
            print "</cite>";
            print "<br/>";
            print "<cite>";
            print "<b>Vote count: ".$row['vote']."</b>";
            print "</cite>";
            print "</footer>";
	    print "<form action='vote.php' method='GET'>";
            print "<input type='hidden' name='vote' value='".$row['user']."' />";
            print "<input type='submit' value='Vote for me' />";
            print "</form>";
            print "</blockquote>";
            print "</blockquote>";
        }
    }
    catch(PDOException $e)
    {
       	print($e->getMessage());
    }
}

// Print the image submit form
function image_submit_form()
{
    print '<form action="index.php" method="post">';
    print '<fieldset>';
    print '<div class="col-lg-6">';
    print '  <div class="input-group">';
    print '    <input id="message" class="form-control" name="link" placeholder="Input your image link here..."/>';
    print '    <span class="input-group-btn">';
    print '	 <button id="post" name="post" type="submit" class="btn btn-primary">Submit / Update</button>';
    print '    </span>';
    print '  </div>';
    print '</div>';
    print '</fieldset>';
    print '</form>';

}

function file_get_contents_curl($url) {
    $ch = curl_init();
  
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_URL, $url);
  
    $data = curl_exec($ch);
    curl_close($ch);
  
    return $data;
}

function random_string($length) {
    $key = '';
    $keys = array_merge(range(0, 9), range('a', 'z'));

    for ($i = 0; $i < $length; $i++) {
        $key .= $keys[array_rand($keys)];
    }

    return $key;
}

function generate_filename($user, $filename, $extension) 
{
    $path = $GLOBALS["FILE_DIREC"] . $user . "/";
    mkdir($path);
    $full = $path . $filename;
    return $full;
}

// Submit an image link
function submit_image_link($user, $link)
{
    try
    {
     	$db = get_db();
        
        if (check_uniqueness($db, $user))
        {
            $post = $db->prepare("INSERT INTO image VALUES(:link, :user)");
        }
        else
        {
            $post = $db->prepare("UPDATE image SET link=:link WHERE user=:user");
        }
        $info = pathinfo($link);
        $filename = generate_filename($user, $info["filename"], $info["extension"]);
        $data = file_get_contents_curl($link);
        file_put_contents($filename, $data);   
        $type = mime_content_type($filename); // check magic bytes!
        if (strpos($type, 'image') !== false && !in_array($info["extension"], $GLOBALS["BANNED"])) {
            $post->bindParam(':link', $filename);
            $post->bindParam(':user', $user);
            $post->execute();
        } else {
            print("<p>Invalid Image!</p>");
        }
    }
    catch(PDOException $e)
    {
     	print($e->getMessage());
    }
}



//Save vote and voter
function vote($from,$to)
{
    try
    {
        $db = get_db();

	//Save vote
        $check = $db->prepare("SELECT * FROM votereceived WHERE user=:name");
        $check->bindParam(':name', $to);
        $result = $check->execute();

        if ($result)
        {
            if ($row = $check->fetch())
            {
                $vote = $row['vote'] + 1;
                $action = $db->prepare("UPDATE votereceived SET vote=:vote WHERE user=:name");
                $action->bindParam(':vote',$vote);
                $action->bindParam(':name',$to);
                $action->execute();
            }
            else
            {
                return false;
            }
        }
        else
        {
            return false;
        }

        //Save voter
        $check = $db->prepare("SELECT * FROM vote WHERE user=:name");
        $check->bindParam(':name', $from);
        $result = $check->execute();

        if ($result)
        {
            if ($row = $check->fetch())
            {
                $vote = $row['vote'] + 1;
                $action = $db->prepare("UPDATE vote SET vote=:vote WHERE user=:name");
                $action->bindParam(':vote',$vote);
                $action->bindParam(':name',$from);
                $action->execute();
            }
            else
            {
                return false;
            }
        }
        else
        {
            return false;
        }
        return true;
    }
    catch(PDOException $e)
    {
        print($e->getMessage());
        return false;
    }
}

?>
