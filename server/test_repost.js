async function testRepost() {
  try {
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testuser@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Got token:', !!token);

    console.log('Fetching posts...');
    const postsRes = await fetch('http://localhost:5000/api/posts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const postsData = await postsRes.json();
    
    if (postsData.length === 0) {
      console.log('No posts found to repost!');
      return;
    }

    const postId = postsData[0]._id;
    console.log('Attempting to repost post:', postId);

    const repostRes = await fetch(`http://localhost:5000/api/posts/${postId}/repost`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    const errorText = await repostRes.text();
    console.log('Repost Success:', repostRes.status);
    require('fs').writeFileSync('error_log.json', errorText);
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

testRepost();
