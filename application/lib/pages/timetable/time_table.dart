import 'package:flutter/material.dart';

class MyTimeTable extends StatefulWidget {
  const MyTimeTable({super.key});

  @override
  State<MyTimeTable> createState() => _MyTimeTableState();
}

class _MyTimeTableState extends State<MyTimeTable> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Time Table'),
      ),
      body: Center(
        child: Text('Time Table Page'),
      ),
    );
  }
}