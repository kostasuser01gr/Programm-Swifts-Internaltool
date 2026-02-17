import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:shiftforge/app.dart';

void main() {
  testWidgets('ShiftForgeApp renders without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: ShiftForgeApp(),
      ),
    );

    // App should render the title somewhere in the widget tree
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
